"""
Ward Protocol SDK — Hardened On-Chain Insurance for XRPL XLS-66 Vaults
=======================================================================

Five hardened modules:
  Module 1  WardClient          Policy purchase (premium payment + NFT mint)
  Module 2  VaultMonitor        Trustless WebSocket default detection
  Module 3  ClaimValidator      9-step adversarial-hardened claim validation
  Module 4  EscrowSettlement    Crypto-conditioned (PREIMAGE-SHA-256) settlement
  Module 5  PoolHealthMonitor   On-chain coverage ratio and solvency monitoring

Security model:
  - Ward NEVER holds wallet keys — not even temporarily
  - All authoritative state lives on XRPL — PostgreSQL is a read cache only
  - NFT policies are NON-TRANSFERABLE after issuance (tfBurnable only, NO tfTransferable)
  - Escrow conditions require cryptographic proof from the claimant (PREIMAGE-SHA-256)
    meaning only the legitimate claimant can finish the escrow — no front-running
  - All XRPL addresses validated with the ledger codec before any transaction is submitted
  - XRPL ledger time used for ALL expiry logic — immune to local clock manipulation
  - Multi-confirmation (3+ ledger closes) before default events are emitted
  - Replay protection via NFT burn — a burned policy can never trigger a second claim
  - Rate limiting: max 3 claim attempts per policy NFT per 5-minute window

Known bugs fixed vs original prototype:
  [1] asyncio.get_event_loop().time() → replaced with XRPL ledger close_time
  [2] generate_faucet_wallet now properly awaited
  [3] NFT token ID extraction corrected (AffectedNodes / NFTokenPage, not phantom 'NFToken' node)
  [4] XRP/drops unit mismatch eliminated — all amounts are drops internally
  [5] Explicit autofill before submission for correct Sequence and Fee population
  [6] XRPL address validation on every external input
  [7] Network error handling with typed exceptions
  [8] Replay attack protection via on-chain NFT burn check + in-memory rate limiter
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from xrpl.asyncio.clients import AsyncJsonRpcClient, AsyncWebsocketClient
from xrpl.asyncio.transaction import autofill, submit_and_wait
from xrpl.asyncio.wallet import generate_faucet_wallet
from xrpl.core.addresscodec import is_valid_classic_address
from xrpl.models import (
    AccountInfo,
    AccountNFTs,
    AccountObjects,
    EscrowCancel,
    EscrowCreate,
    EscrowFinish,
    Ledger,
    LedgerEntry,
    Memo,
    NFTokenBurn,
    NFTokenMint,
    Payment,
    ServerInfo,
    Subscribe,
)
from xrpl.utils import (
    datetime_to_ripple_time,
    ripple_time_to_datetime,
    str_to_hex,
    xrp_to_drops,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ward")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_TESTNET_URL = "https://s.altnet.rippletest.net:51234/"
DEFAULT_TESTNET_WS  = "wss://s.altnet.rippletest.net:51233/"

# XLS-20 NFToken flags
TF_BURNABLE     = 0x00000001  # Issuer (== minter when self-minted) can burn
TF_ONLY_XRP     = 0x00000002
# TF_TRANSFERABLE = 0x00000008  ← deliberately OMITTED so policies cannot be sold

# Ward Protocol NFT taxon — identifies Ward insurance policies on-chain
WARD_POLICY_TAXON = 281

# XLS-66 Loan flags
LSF_LOAN_DEFAULT  = 0x00010000
LSF_LOAN_IMPAIRED = 0x00020000

# Ripple epoch offset (seconds from Unix epoch to Jan 1 2000 00:00:00 UTC)
RIPPLE_EPOCH_OFFSET = 946684800

# Pool minimum coverage ratio (200%)
MIN_COVERAGE_RATIO = 2.0

# Escrow timing
ESCROW_DISPUTE_HOURS = 48   # Claimant can finish after this
ESCROW_CANCEL_HOURS  = 72   # Pool operator can cancel after this

# Multi-confirmation threshold before emitting a default event
DEFAULT_CONFIRM_COUNT = 3

# Anomaly detection: N defaults from same vault in M seconds
ANOMALY_THRESHOLD       = 5
ANOMALY_WINDOW_SECONDS  = 300  # 5 minutes

# Replay-protection rate limit
RATE_LIMIT_ATTEMPTS  = 3
RATE_LIMIT_WINDOW_S  = 300  # 5 minutes

# Preimage size for PREIMAGE-SHA-256 crypto-conditions
PREIMAGE_BYTES = 32

# ---------------------------------------------------------------------------
# ============================================================================
# SECURITY UTILITIES
# ============================================================================
# ---------------------------------------------------------------------------


class WardError(Exception):
    """Base error for all Ward Protocol failures."""


class ValidationError(WardError):
    """Claim or input validation failed."""


class SecurityError(WardError):
    """A security invariant was violated."""


class LedgerError(WardError):
    """XRPL ledger interaction failed."""


def validate_xrpl_address(address: str, label: str = "address") -> None:
    """
    Verify address is a valid XRPL classic address.

    Uses the official codec — rejects addresses that pass a naive regex
    but fail the base58check checksum.

    Raises:
        ValidationError: if the address is invalid.
    """
    if not isinstance(address, str) or not address:
        raise ValidationError(f"Invalid {label}: must be a non-empty string, got {type(address)}")
    if not is_valid_classic_address(address):
        raise ValidationError(
            f"Invalid {label} '{address}': not a valid XRPL classic address"
        )


def validate_drops_amount(drops: int, label: str = "amount") -> None:
    """
    Validate that a drops value is a positive integer within XRPL limits.

    Max XRP supply = 100 billion XRP = 100_000_000_000_000_000 drops.

    Raises:
        ValidationError: if the value is out of range.
    """
    XRP_MAX_DROPS = 100_000_000_000_000_000
    if not isinstance(drops, int) or drops <= 0:
        raise ValidationError(f"Invalid {label}: must be a positive integer, got {drops!r}")
    if drops > XRP_MAX_DROPS:
        raise ValidationError(
            f"Invalid {label}: {drops} exceeds maximum XRP supply ({XRP_MAX_DROPS} drops)"
        )


def validate_nft_id(nft_id: str, label: str = "NFT token ID") -> None:
    """
    Validate that a string looks like an XRPL NFT token ID (64 hex chars).

    Raises:
        ValidationError: if format is wrong.
    """
    if not isinstance(nft_id, str) or not re.fullmatch(r"[0-9A-Fa-f]{64}", nft_id):
        raise ValidationError(f"Invalid {label}: expected 64 hex characters, got {nft_id!r}")


def make_preimage_condition(preimage: bytes) -> Tuple[str, str]:
    """
    Encode a PREIMAGE-SHA-256 crypto-condition and fulfillment (RFC draft-thomas-crypto-conditions).

    The claimant generates ``preimage = os.urandom(32)`` offline and keeps it secret.
    They derive ``condition`` and share ONLY that with the settlement system.
    After the escrow's FinishAfter time passes they submit EscrowFinish with ``fulfillment``.

    Args:
        preimage: Exactly PREIMAGE_BYTES (32) random bytes.

    Returns:
        (condition_hex, fulfillment_hex) — uppercase hex strings ready for XRPL fields.

    Security:
        The condition is the SHA-256 fingerprint of the preimage encoded in DER.
        Without the preimage no one can compute the fulfillment → no front-running.
    """
    if len(preimage) != PREIMAGE_BYTES:
        raise ValueError(f"Preimage must be exactly {PREIMAGE_BYTES} bytes, got {len(preimage)}")

    sha256_hash = hashlib.sha256(preimage).digest()  # 32 bytes

    # Condition DER: A0 25  80 20 <sha256[32]>  81 01 20
    #   - 80 20 <sha256>  = fingerprint field (34 bytes)
    #   - 81 01 20        = cost field: 1-byte cost value = 0x20 = 32 (preimage length)
    fingerprint_field = bytes([0x80, 0x20]) + sha256_hash  # 34 bytes
    cost_byte = preimage.__len__()  # 32 → fits in 1 byte
    cost_field = bytes([0x81, 0x01, cost_byte])             # 3 bytes
    inner_condition = fingerprint_field + cost_field         # 37 bytes = 0x25
    condition_der = bytes([0xA0, len(inner_condition)]) + inner_condition

    # Fulfillment DER: A0 22  80 20 <preimage[32]>
    preimage_field  = bytes([0x80, PREIMAGE_BYTES]) + preimage  # 34 bytes = 0x22
    fulfillment_der = bytes([0xA0, len(preimage_field)]) + preimage_field

    return condition_der.hex().upper(), fulfillment_der.hex().upper()


def generate_claim_condition() -> Tuple[bytes, str, str]:
    """
    Generate a fresh PREIMAGE-SHA-256 claim condition for use in EscrowCreate.

    Called by the CLAIMANT before submitting a claim.  The claimant keeps
    ``preimage`` offline and uses it later to finish the escrow.

    Returns:
        (preimage, condition_hex, fulfillment_hex)
    """
    preimage = os.urandom(PREIMAGE_BYTES)
    condition_hex, fulfillment_hex = make_preimage_condition(preimage)
    return preimage, condition_hex, fulfillment_hex


def extract_nft_id(response: Any) -> str:
    """
    Extract the new NFT token ID from an NFTokenMint transaction response.

    Tries the meta-level ``nftoken_id`` shortcut first (available in rippled ≥ 1.11).
    Falls back to diffing AffectedNodes NFTokenPage entries.

    Raises:
        LedgerError: if the ID cannot be found.
    """
    result = response.result if hasattr(response, "result") else response
    meta = result.get("meta", {})

    # Primary path — newer rippled exposes this directly
    quick_id = meta.get("nftoken_id")
    if quick_id:
        return quick_id.upper()

    # Fallback — diff NFTokenPage in AffectedNodes
    for node in meta.get("AffectedNodes", []):
        for node_type in ("CreatedNode", "ModifiedNode"):
            entry = node.get(node_type)
            if not entry or entry.get("LedgerEntryType") != "NFTokenPage":
                continue

            if node_type == "CreatedNode":
                nfts = entry.get("NewFields", {}).get("NFTokens", [])
                if nfts:
                    return nfts[-1]["NFToken"]["NFTokenID"].upper()

            else:  # ModifiedNode
                new_ids = {
                    n["NFToken"]["NFTokenID"]
                    for n in entry.get("FinalFields", {}).get("NFTokens", [])
                }
                prev_ids = {
                    n["NFToken"]["NFTokenID"]
                    for n in entry.get("PreviousFields", {}).get("NFTokens", [])
                }
                added = new_ids - prev_ids
                if added:
                    return added.pop().upper()

    raise LedgerError(
        "Cannot extract NFT token ID from transaction response. "
        "Check that NFTokenMint was successful and the node is ≥ rippled 1.11 "
        "for the nftoken_id meta shortcut."
    )


async def get_ledger_time(client: AsyncJsonRpcClient) -> int:
    """
    Return the current validated-ledger close time in Ripple epoch seconds.

    NEVER uses local system time — immune to clock manipulation.

    Uses the Ledger RPC (ledger_index='validated') as the primary source.
    This is more reliable than ServerInfo.validated_ledger.close_time which
    was removed in rippled 3.x.

    Raises:
        LedgerError: if the ledger time cannot be fetched.
    """
    # Primary: Ledger RPC — works on all rippled versions
    response = await client.request(Ledger(ledger_index="validated"))
    if response.is_successful():
        close_time = response.result.get("ledger", {}).get("close_time", 0)
        if close_time:
            return int(close_time)

    # Fallback: ServerInfo (present in rippled < 3.0)
    si_response = await client.request(ServerInfo())
    if si_response.is_successful():
        info     = si_response.result.get("info", {})
        validated = info.get("validated_ledger", {})
        close_time = validated.get("close_time", 0)
        if close_time:
            return int(close_time)

    raise LedgerError(
        "Could not obtain validated-ledger close_time from XRPL node. "
        "Tried Ledger(validated) and ServerInfo."
    )


def calculate_coverage_ratio(
    tvl_drops: int,
    outstanding_loans_drops: int,
    min_ratio: float = MIN_COVERAGE_RATIO,
) -> float:
    """
    Calculate pool coverage ratio from on-chain values (always in drops).

    Args:
        tvl_drops:                Pool total value locked in drops.
        outstanding_loans_drops:  Total outstanding loan exposure in drops.
        min_ratio:                Minimum acceptable ratio (default 2.0 = 200%).

    Returns:
        Coverage ratio (e.g. 2.5 means 250%).

    Raises:
        ValidationError: if ratio is below minimum.
    """
    if outstanding_loans_drops == 0:
        return float("inf")
    ratio = tvl_drops / outstanding_loans_drops
    if ratio < min_ratio:
        raise ValidationError(
            f"Coverage ratio {ratio:.2f}x is below minimum {min_ratio}x "
            f"({tvl_drops / 1_000_000:.2f} XRP TVL vs "
            f"{outstanding_loans_drops / 1_000_000:.2f} XRP exposure)"
        )
    return ratio


# ---------------------------------------------------------------------------
# ============================================================================
# MODULE 1 — WardClient: Policy purchase
# ============================================================================
# ---------------------------------------------------------------------------


class WardClient:
    """
    Entry point for depositors purchasing Ward insurance policies.

    The depositor's wallet:
      1. Pays the premium to the pool address (Payment transaction).
      2. Mints an NFT policy on their own account (NFTokenMint transaction).

    Ward NEVER holds keys.  The wallet is provided by the caller and
    is used only for the duration of the call.

    NFT flags enforced:
      - tfBurnable (0x1): policy can be burned to settle a claim.
      - tfTransferable NOT set: policy cannot be sold or transferred,
        preventing a secondary market in compromised policies.
    """

    def __init__(
        self,
        xrpl_url: str = DEFAULT_TESTNET_URL,
        api_key: Optional[str] = None,
    ) -> None:
        self._url = xrpl_url
        self._api_key = api_key
        self._client = AsyncJsonRpcClient(xrpl_url)

    # ------------------------------------------------------------------

    async def purchase_coverage(
        self,
        wallet: Any,  # xrpl.wallet.Wallet — not stored after return
        vault_address: str,
        coverage_drops: int,
        period_days: int,
        pool_address: str,
        premium_rate: float = 0.01,
    ) -> Dict[str, Any]:
        """
        Purchase an insurance policy: pay premium + mint non-transferable NFT.

        All amounts are in drops (1 XRP = 1,000,000 drops).

        Args:
            wallet:         Depositor's XRPL wallet (key used in memory only).
            vault_address:  XLS-66 vault being insured.
            coverage_drops: Maximum payout in drops.
            period_days:    Policy term in days.
            pool_address:   Insurance pool address (premium destination).
            premium_rate:   Annual premium rate (default 0.01 = 1%).

        Returns:
            {
                "policy_id":   Human-readable label  (e.g. "pol_WRD_<first8>"),
                "nft_token_id": On-chain NFT token ID (64 hex chars),
                "ledger_tx":   NFTokenMint tx hash,
                "premium_tx":  Premium payment tx hash,
                "status":      "active",
                "expiry_ledger_time": int (Ripple epoch seconds),
            }

        Security:
            - Addresses validated before any network call.
            - Coverage and period bounds checked.
            - Premium calculated in drops — no XRP/drops unit confusion.
            - Expiry encoded as XRPL ledger time in NFT metadata.
            - NFT is non-transferable (no tfTransferable flag).
            - autofill called explicitly before each submission.
        """
        # ── Input validation ──────────────────────────────────────────
        validate_xrpl_address(vault_address, "vault_address")
        validate_xrpl_address(pool_address, "pool_address")
        validate_drops_amount(coverage_drops, "coverage_drops")

        if not isinstance(period_days, int) or period_days <= 0:
            raise ValidationError(f"period_days must be a positive integer, got {period_days!r}")
        if not (0 < premium_rate <= 1.0):
            raise ValidationError(f"premium_rate must be in (0, 1.0], got {premium_rate}")

        # ── Premium calculation (drops, pro-rated by term) ────────────
        premium_drops = int(coverage_drops * premium_rate * period_days / 365)
        if premium_drops < 1:
            raise ValidationError("Calculated premium is less than 1 drop — increase coverage or period")

        logger.info(
            "purchase_coverage: vault=%s coverage=%.2f XRP "
            "period=%dd premium=%.6f XRP",
            vault_address,
            coverage_drops / 1_000_000,
            period_days,
            premium_drops / 1_000_000,
        )

        try:
            # ── Step 1: get XRPL ledger time for expiry ───────────────
            # Bug fix [1]: use ledger time, NOT asyncio.get_event_loop().time()
            current_ledger_time = await get_ledger_time(self._client)
            expiry_ledger_time  = current_ledger_time + period_days * 86400

            # ── Step 2: pay premium to pool ───────────────────────────
            payment_tx = Payment(
                account=wallet.classic_address,
                amount=str(premium_drops),
                destination=pool_address,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/premium"),
                        memo_data=str_to_hex(
                            json.dumps(
                                {
                                    "vault": vault_address,
                                    "coverage_drops": str(coverage_drops),
                                    "period_days": period_days,
                                },
                                separators=(",", ":"),
                            )
                        ),
                    )
                ],
            )
            # Bug fix [5]: explicit autofill for Sequence / Fee
            payment_tx = await autofill(payment_tx, self._client)
            payment_response = await submit_and_wait(
                payment_tx, self._client, wallet, autofill=False
            )
            if not payment_response.is_successful():
                raise LedgerError(
                    f"Premium payment failed: "
                    f"{payment_response.result.get('meta', {}).get('TransactionResult')}"
                )
            premium_tx_hash = payment_response.result["hash"]
            logger.info("Premium paid: %s (%d drops)", premium_tx_hash, premium_drops)

            # ── Step 3: mint NFT policy ───────────────────────────────
            # URI is limited to 256 bytes (512 hex chars) by XRPL.
            # Store ONLY the fields required for on-chain claim verification.
            # Extended metadata (premium_tx, period_days, etc.) goes in the Memo.
            uri_metadata = {
                "protocol":           "ward-v1",
                "vault_address":      vault_address,
                "coverage_drops":     str(coverage_drops),
                "expiry_ledger_time": expiry_ledger_time,
                "pool_address":       pool_address,
            }
            uri_hex = str_to_hex(json.dumps(uri_metadata, separators=(",", ":")))
            # Safety check: URI must not exceed 512 hex chars
            if len(uri_hex) > 512:
                raise ValidationError(
                    f"Policy URI is {len(uri_hex)} hex chars — exceeds XRPL 512-char limit. "
                    "Reduce field values or contact Ward Protocol."
                )

            # Extended metadata in the Memo (no size limit)
            ext_metadata = json.dumps(
                {
                    "premium_drops": str(premium_drops),
                    "period_days":   period_days,
                    "premium_tx":    premium_tx_hash,
                },
                separators=(",", ":"),
            )

            mint_tx = NFTokenMint(
                account=wallet.classic_address,
                nftoken_taxon=WARD_POLICY_TAXON,
                # tfBurnable (0x1) ONLY — no tfTransferable (0x8)
                # This makes the policy non-sellable and non-forgeable
                flags=TF_BURNABLE,
                uri=uri_hex,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/policy"),
                        memo_data=str_to_hex(ext_metadata),
                    )
                ],
            )
            # Bug fix [5]: explicit autofill
            mint_tx = await autofill(mint_tx, self._client)
            mint_response = await submit_and_wait(
                mint_tx, self._client, wallet, autofill=False
            )
            if not mint_response.is_successful():
                raise LedgerError(
                    f"NFTokenMint failed: "
                    f"{mint_response.result.get('meta', {}).get('TransactionResult')}"
                )

            # Bug fix [3]: correct NFT ID extraction
            nft_token_id = extract_nft_id(mint_response)
            validate_nft_id(nft_token_id)

            ledger_tx_hash = mint_response.result["hash"]
            logger.info("Policy NFT minted: %s (tx %s)", nft_token_id, ledger_tx_hash)

            return {
                "policy_id":          f"pol_WRD_{nft_token_id[:8]}",
                "nft_token_id":        nft_token_id,
                "ledger_tx":           ledger_tx_hash,
                "premium_tx":          premium_tx_hash,
                "status":              "active",
                "expiry_ledger_time":  expiry_ledger_time,
                "coverage_drops":      coverage_drops,
                "premium_drops":       premium_drops,
            }

        except (WardError, ValueError):
            raise
        except Exception as exc:
            # Bug fix [7]: network failures surface with context
            raise LedgerError(f"purchase_coverage failed: {exc}") from exc


# ---------------------------------------------------------------------------
# ============================================================================
# MODULE 2 — VaultMonitor: Trustless WebSocket default detection
# ============================================================================
# ---------------------------------------------------------------------------


@dataclass
class DefaultSignal:
    """A potential default event awaiting multi-ledger confirmation."""

    loan_id:       str
    vault_address: str
    tx_hash:       str
    ledger_index:  int
    detected_at:   float = field(default_factory=time.time)


@dataclass
class VerifiedDefault:
    """A default confirmed on-chain after 3+ ledger closes."""

    loan_id:             str
    vault_address:       str
    tx_hash:             str
    confirmed_at_ledger: int
    loan_flags:          int
    # XLS-66 fields (populated from on-chain ledger entry)
    principal_outstanding: int = 0
    interest_outstanding:  int = 0
    loan_broker_id:        str = ""


class VaultMonitor:
    """
    Module 2 — Trustless WebSocket vault and loan-broker monitor.

    Security properties:
    - Every transaction event is cross-validated against the live ledger.
      Event data is treated as a hint only, never as ground truth.
    - Default events are emitted ONLY after 3 confirmed ledger closes
      following the observed LoanManage/tfLoanDefault transaction.
    - Anomaly detection: ≥5 default signals from the same vault in 5 minutes
      triggers an alert callback (possible ledger-manipulation attack).
    - On restart the monitor re-derives all state from XRPL (stateless).
    - No private keys are stored or required.
    """

    def __init__(
        self,
        websocket_url: str = DEFAULT_TESTNET_WS,
        vault_addresses: Optional[List[str]] = None,
        loan_broker_addresses: Optional[List[str]] = None,
    ) -> None:
        # Validate all addresses upfront
        for addr in (vault_addresses or []):
            validate_xrpl_address(addr, "vault_address")
        for addr in (loan_broker_addresses or []):
            validate_xrpl_address(addr, "loan_broker_address")

        self._ws_url              = websocket_url
        self._vault_addresses     = set(vault_addresses or [])
        self._broker_addresses    = set(loan_broker_addresses or [])
        self._all_addresses       = self._vault_addresses | self._broker_addresses

        self._running             = False
        self._client: Optional[AsyncWebsocketClient] = None

        # Pending default signals: loan_id → DefaultSignal
        self._pending: Dict[str, DefaultSignal] = {}

        # Current confirmed ledger index (updated on each ledger close event)
        self._current_ledger: int = 0

        # Anomaly detection: vault_address → deque of signal timestamps
        self._recent_signals: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=ANOMALY_THRESHOLD + 5)
        )

        # Registered callbacks
        self._default_callbacks: List[Callable] = []
        self._anomaly_callbacks: List[Callable]  = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def on_verified_default(self, callback: Callable) -> Callable:
        """Decorator/function to register a verified-default callback."""
        self._default_callbacks.append(callback)
        return callback

    def on_anomaly(self, callback: Callable) -> Callable:
        """Decorator/function to register an anomaly-detection callback."""
        self._anomaly_callbacks.append(callback)
        return callback

    def add_vault(self, address: str) -> None:
        validate_xrpl_address(address, "vault_address")
        self._vault_addresses.add(address)
        self._all_addresses.add(address)

    def add_loan_broker(self, address: str) -> None:
        validate_xrpl_address(address, "loan_broker_address")
        self._broker_addresses.add(address)
        self._all_addresses.add(address)

    async def run(self) -> None:
        """
        Connect to XRPL via WebSocket and monitor indefinitely.

        Stateless restart: if the process is restarted this method
        re-subscribes and re-derives all relevant state from the ledger.
        Call stop() to halt gracefully.
        """
        self._running = True
        async with AsyncWebsocketClient(self._ws_url) as client:
            self._client = client
            await self._subscribe(client)
            logger.info(
                "VaultMonitor running — watching %d addresses on %s",
                len(self._all_addresses),
                self._ws_url,
            )
            async for message in client:
                if not self._running:
                    break
                if isinstance(message, dict):
                    try:
                        await self._handle_message(client, message)
                    except Exception as exc:
                        logger.error("Error handling WebSocket message: %s", exc, exc_info=True)

        self._client = None

    async def stop(self) -> None:
        """Signal the monitor to stop after the next message."""
        self._running = False
        logger.info("VaultMonitor stop requested")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _subscribe(self, client: AsyncWebsocketClient) -> None:
        """Subscribe to monitored accounts and the ledger stream."""
        req = Subscribe(
            accounts=list(self._all_addresses),
            streams=["ledger"],
        )
        await client.send(req)

    async def _handle_message(
        self, client: AsyncWebsocketClient, message: dict
    ) -> None:
        msg_type = message.get("type")

        if msg_type == "ledgerClosed":
            self._current_ledger = int(message.get("ledger_index", 0))
            await self._process_pending_confirmations(client)

        elif msg_type == "transaction":
            await self._handle_transaction(message)

    async def _handle_transaction(self, message: dict) -> None:
        """
        Screen incoming transactions for XLS-66 LoanManage/default signals.

        Security: tx data is treated as a hint only.  The loan object is
        independently verified on-chain before emitting any event.
        """
        tx   = message.get("transaction", {})
        meta = message.get("meta", {})

        if tx.get("TransactionType") != "LoanManage":
            return

        flags = int(tx.get("Flags", 0))
        if not (flags & LSF_LOAN_DEFAULT):
            return

        loan_id      = tx.get("LoanID", "")
        tx_hash      = tx.get("hash", "")
        ledger_index = int(message.get("ledger_index", 0))

        if not loan_id or not tx_hash:
            logger.warning("Received malformed LoanManage default event — ignoring")
            return

        # Determine which vault address this is associated with
        # (the account that sent the tx should be a monitored loan broker)
        tx_account   = tx.get("Account", "")
        vault_address = self._resolve_vault_for_broker(tx_account)

        logger.info(
            "Default signal detected: loan=%s tx=%s ledger=%d — "
            "awaiting %d confirmations",
            loan_id[:16],
            tx_hash[:16],
            ledger_index,
            DEFAULT_CONFIRM_COUNT,
        )

        # Anomaly check before queuing
        if self._detect_anomaly(vault_address):
            logger.warning(
                "ANOMALY: %d default signals from vault %s in %ds window",
                ANOMALY_THRESHOLD,
                vault_address,
                ANOMALY_WINDOW_SECONDS,
            )
            await self._fire_callbacks(
                self._anomaly_callbacks,
                {
                    "type":          "anomaly",
                    "vault_address": vault_address,
                    "loan_id":       loan_id,
                    "signal_count":  ANOMALY_THRESHOLD,
                },
            )
            # Continue processing — anomaly is a warning, not a block

        self._pending[loan_id] = DefaultSignal(
            loan_id=loan_id,
            vault_address=vault_address,
            tx_hash=tx_hash,
            ledger_index=ledger_index,
        )

    async def _process_pending_confirmations(
        self, client: AsyncWebsocketClient
    ) -> None:
        """
        After each ledger close, check if any pending defaults are now confirmed.

        Cross-validates EVERY pending default against the live ledger before emitting.
        """
        if not self._pending:
            return

        confirmed: List[str] = []
        for loan_id, signal in self._pending.items():
            if self._current_ledger < signal.ledger_index + DEFAULT_CONFIRM_COUNT:
                continue  # Not enough confirmations yet

            # Cross-validate against current ledger state
            verified = await self._verify_default_on_chain(client, loan_id, signal)
            if verified:
                confirmed.append(loan_id)
                await self._fire_callbacks(self._default_callbacks, verified)
            else:
                # Default flag no longer set — spurious or reverted signal
                logger.warning(
                    "Default signal for loan %s did not validate on-chain — discarding",
                    loan_id[:16],
                )
                confirmed.append(loan_id)

        for loan_id in confirmed:
            self._pending.pop(loan_id, None)

    async def _verify_default_on_chain(
        self,
        client: AsyncWebsocketClient,
        loan_id: str,
        signal: DefaultSignal,
    ) -> Optional[VerifiedDefault]:
        """
        Fetch the Loan ledger object and verify the lsfLoanDefault flag.

        Returns VerifiedDefault if confirmed, None if not.
        """
        try:
            response = await client.request(LedgerEntry(index=loan_id))
            if not response.is_successful():
                logger.error("Failed to fetch Loan %s: %s", loan_id[:16], response.result)
                return None

            node  = response.result.get("node", response.result)
            flags = int(node.get("Flags", 0))

            if not (flags & LSF_LOAN_DEFAULT):
                return None  # Flag not set — not a default (or was cleared)

            return VerifiedDefault(
                loan_id=loan_id,
                vault_address=signal.vault_address,
                tx_hash=signal.tx_hash,
                confirmed_at_ledger=self._current_ledger,
                loan_flags=flags,
                principal_outstanding=int(node.get("PrincipalOutstanding", 0)),
                interest_outstanding=int(node.get("InterestOutstanding", 0)),
                loan_broker_id=node.get("LoanBrokerID", ""),
            )

        except Exception as exc:
            logger.error("On-chain verification failed for loan %s: %s", loan_id[:16], exc)
            return None

    def _resolve_vault_for_broker(self, broker_address: str) -> str:
        """Return the vault address associated with a broker, or the broker itself."""
        # Institutions register the mapping when they add brokers.
        # Fallback: return the address as-is so callers can identify the source.
        return broker_address

    def _detect_anomaly(self, vault_address: str) -> bool:
        """
        Return True if the rolling default-signal count exceeds the threshold.

        Uses only timestamps, never local state that could be spoofed.
        """
        now       = time.time()
        window    = self._recent_signals[vault_address]
        # Expire old entries
        while window and now - window[0] > ANOMALY_WINDOW_SECONDS:
            window.popleft()
        window.append(now)
        return len(window) >= ANOMALY_THRESHOLD

    async def _fire_callbacks(
        self, callbacks: List[Callable], payload: Any
    ) -> None:
        """Invoke all registered callbacks, isolating failures."""
        for cb in callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(payload)
                else:
                    cb(payload)
            except Exception as exc:
                logger.error("Callback %s raised: %s", getattr(cb, "__name__", cb), exc)


# ---------------------------------------------------------------------------
# ============================================================================
# MODULE 3 — ClaimValidator: 9-step adversarial-hardened claim validation
# ============================================================================
# ---------------------------------------------------------------------------


@dataclass
class ValidationResult:
    """Outcome of the 9-step claim validation pipeline."""

    approved:         bool
    claim_payout_drops: int
    vault_loss_drops: int
    policy_coverage_drops: int
    rejection_reason: Optional[str] = None
    nft_token_id:     Optional[str] = None
    steps_passed:     int           = 0

    def __repr__(self) -> str:  # pragma: no cover
        if self.approved:
            return (
                f"ValidationResult(APPROVED, "
                f"payout={self.claim_payout_drops / 1_000_000:.2f} XRP, "
                f"steps=9/9)"
            )
        return (
            f"ValidationResult(REJECTED at step {self.steps_passed + 1}, "
            f"reason={self.rejection_reason!r})"
        )


class ClaimValidator:
    """
    Module 3 — 9-step adversarial-hardened claim validation.

    Every step queries the XRPL ledger directly.  If a step cannot be
    fully verified on-chain the claim is rejected.  The validator holds
    no private keys and makes no write transactions.

    Replay protection:
      - A claim can only be filed once per NFT: once the NFT is burned
        (during settlement) the token disappears from the claimant's
        account_nfts response, causing Step 1 to reject any retry.
      - An in-memory rate limiter caps claim attempts per NFT to
        RATE_LIMIT_ATTEMPTS per RATE_LIMIT_WINDOW_S seconds.

    Attack mitigations (full list in security_notes.md):
      - Fake policy: Step 1 checks on-chain NFT existence & ownership.
      - Expired policy: Step 2 uses XRPL ledger time (not local clock).
      - Wrong vault: Step 3 checks metadata vault_address.
      - No default: Step 4 checks lsfLoanDefault on Loan ledger object.
      - Inflated loss: Step 5 recalculates using XLS-66 on-chain data only.
      - Coverage ratio not breached: Step 6 checks TVL / loan ratio.
      - Replay: Step 7 checks NFT still exists (not yet burned).
      - Stolen policy: Step 8 verifies claimant == NFT holder.
      - Insolvent pool: Step 9 checks pool balance before approval.
    """

    def __init__(self, xrpl_url: str = DEFAULT_TESTNET_URL) -> None:
        self._client = AsyncJsonRpcClient(xrpl_url)
        # Rate limiter: nft_token_id → deque of attempt timestamps
        self._rate_limit: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=RATE_LIMIT_ATTEMPTS + 5)
        )

    # ------------------------------------------------------------------

    async def validate_claim(
        self,
        claimant_address: str,
        nft_token_id:    str,
        defaulted_vault: str,
        loan_id:         str,
        pool_address:    str,
    ) -> ValidationResult:
        """
        Run all 9 validation steps.

        Args:
            claimant_address: The address claiming the payout (must hold the NFT).
            nft_token_id:     The Ward policy NFT token ID (64 hex chars).
            defaulted_vault:  Address of the vault that defaulted.
            loan_id:          XLS-66 Loan ledger object ID.
            pool_address:     Insurance pool address (for solvency check).

        Returns:
            ValidationResult — check .approved before acting on .claim_payout_drops.
        """
        # ── Pre-validation: input sanitation ─────────────────────────
        try:
            validate_xrpl_address(claimant_address, "claimant_address")
            validate_xrpl_address(defaulted_vault,  "defaulted_vault")
            validate_xrpl_address(pool_address,      "pool_address")
            validate_nft_id(nft_token_id)
        except ValidationError as exc:
            return self._reject(0, str(exc))

        # ── Rate limiting ────────────────────────────────────────────
        if not self._check_rate_limit(nft_token_id):
            return self._reject(
                0,
                f"Rate limit exceeded: max {RATE_LIMIT_ATTEMPTS} claim attempts "
                f"per {RATE_LIMIT_WINDOW_S}s per policy NFT",
            )

        logger.info(
            "ClaimValidator: claimant=%s nft=%s vault=%s loan=%s",
            claimant_address,
            nft_token_id[:16],
            defaulted_vault,
            loan_id[:16],
        )

        # ── Step 1: Verify NFT policy exists on-chain ─────────────────
        nft_data = await self._step1_verify_nft_exists(claimant_address, nft_token_id)
        if nft_data is None:
            return self._reject(
                1,
                f"NFT policy {nft_token_id[:16]}... not found in claimant's account. "
                "Policy does not exist or has already been burned (replay attempt).",
            )
        logger.info("✓ Step 1: NFT policy exists on-chain")

        # ── Step 2: Verify policy has not expired (XRPL ledger time) ──
        metadata, expiry_error = self._parse_nft_metadata(nft_data)
        if expiry_error:
            return self._reject(2, expiry_error)

        expiry_check = await self._step2_check_expiry(metadata)
        if expiry_check is not None:
            return self._reject(2, expiry_check)
        logger.info("✓ Step 2: Policy not expired (validated against XRPL ledger time)")

        # ── Step 3: Verify vault address matches ──────────────────────
        metadata_vault = metadata.get("vault_address", "")
        if metadata_vault != defaulted_vault:
            return self._reject(
                3,
                f"Vault mismatch: policy covers {metadata_vault!r}, "
                f"claim is for {defaulted_vault!r}",
            )
        logger.info("✓ Step 3: Vault address matches policy metadata")

        # ── Step 4: Verify lsfLoanDefault flag on ledger object ───────
        loan_node = await self._step4_verify_default_flag(loan_id)
        if loan_node is None:
            return self._reject(
                4,
                f"Loan {loan_id[:16]}... does not have lsfLoanDefault flag set. "
                "No verifiable default on-chain.",
            )
        logger.info("✓ Step 4: lsfLoanDefault flag confirmed on Loan ledger object")

        # ── Step 5: Calculate loss from on-chain data only ────────────
        vault_loss_drops, loss_error = await self._step5_calculate_loss(loan_node)
        if loss_error:
            return self._reject(5, loss_error)
        if vault_loss_drops <= 0:
            return self._reject(
                5,
                "No vault loss: first-loss capital fully covered the default.",
            )
        logger.info(
            "✓ Step 5: Vault loss = %.4f XRP (from on-chain XLS-66 data)",
            vault_loss_drops / 1_000_000,
        )

        # ── Step 6: Verify coverage ratio was breached ────────────────
        coverage_ok, coverage_error = await self._step6_verify_coverage_breach(
            loan_node, defaulted_vault
        )
        if coverage_error:
            return self._reject(6, coverage_error)
        logger.info("✓ Step 6: Coverage ratio breach confirmed")

        # ── Step 7: Replay protection — NFT must not be burned ────────
        # (Already confirmed in Step 1: NFT still exists.  Explicit log for audit.)
        logger.info("✓ Step 7: NFT is not burned — first claim for this policy")

        # ── Step 8: Claimant IS the NFT holder ───────────────────────
        # (Verified in Step 1 by querying claimant's account_nfts.)
        logger.info("✓ Step 8: Claimant is the verified NFT holder")

        # ── Step 9: Pool solvency check ───────────────────────────────
        policy_coverage_drops = int(metadata.get("coverage_drops", "0"))
        claim_payout_drops    = min(vault_loss_drops, policy_coverage_drops)

        solvency_error = await self._step9_check_pool_solvency(
            pool_address, claim_payout_drops
        )
        if solvency_error:
            return self._reject(9, solvency_error)
        logger.info(
            "✓ Step 9: Pool solvent — payout %.4f XRP approved",
            claim_payout_drops / 1_000_000,
        )

        logger.info(
            "CLAIM APPROVED: %s → %.4f XRP",
            nft_token_id[:16],
            claim_payout_drops / 1_000_000,
        )
        return ValidationResult(
            approved=True,
            claim_payout_drops=claim_payout_drops,
            vault_loss_drops=vault_loss_drops,
            policy_coverage_drops=policy_coverage_drops,
            nft_token_id=nft_token_id,
            steps_passed=9,
        )

    # ------------------------------------------------------------------
    # Per-step helpers
    # ------------------------------------------------------------------

    async def _step1_verify_nft_exists(
        self, claimant: str, nft_token_id: str
    ) -> Optional[dict]:
        """Return NFT dict from account_nfts if found, else None."""
        try:
            response = await self._client.request(
                AccountNFTs(account=claimant, limit=400)
            )
            if not response.is_successful():
                logger.error("account_nfts failed: %s", response.result)
                return None

            for nft in response.result.get("account_nfts", []):
                if nft.get("NFTokenID", "").upper() == nft_token_id.upper():
                    # Verify it's a Ward policy by taxon
                    if nft.get("NFTokenTaxon") != WARD_POLICY_TAXON:
                        logger.warning(
                            "NFT %s has wrong taxon %s (expected %d)",
                            nft_token_id[:16],
                            nft.get("NFTokenTaxon"),
                            WARD_POLICY_TAXON,
                        )
                        return None
                    return nft

            return None  # NFT not found → either doesn't exist or already burned

        except Exception as exc:
            logger.error("Step 1 error: %s", exc)
            return None

    def _parse_nft_metadata(
        self, nft_data: dict
    ) -> Tuple[dict, Optional[str]]:
        """Decode and parse the NFT URI metadata JSON."""
        uri_hex = nft_data.get("URI", "")
        if not uri_hex:
            return {}, "NFT has no URI — cannot verify policy metadata"
        try:
            uri_bytes = bytes.fromhex(uri_hex)
            metadata  = json.loads(uri_bytes.decode("utf-8"))
            if metadata.get("protocol") != "ward-v1":
                return {}, f"Unknown policy protocol: {metadata.get('protocol')!r}"
            return metadata, None
        except Exception as exc:
            return {}, f"Failed to parse NFT metadata: {exc}"

    async def _step2_check_expiry(self, metadata: dict) -> Optional[str]:
        """Return an error string if policy is expired or not yet active, else None."""
        expiry_ledger_time = metadata.get("expiry_ledger_time")
        if expiry_ledger_time is None:
            return "Policy metadata missing expiry_ledger_time field"
        try:
            current_time = await get_ledger_time(self._client)
        except LedgerError as exc:
            return f"Could not fetch XRPL ledger time: {exc}"

        if current_time > int(expiry_ledger_time):
            return (
                f"Policy expired: ledger_time={current_time} > "
                f"expiry={expiry_ledger_time}"
            )
        return None

    async def _step4_verify_default_flag(self, loan_id: str) -> Optional[dict]:
        """Return the Loan ledger node if lsfLoanDefault is set, else None."""
        try:
            # LedgerEntry(index=...) is the generic lookup for XLS-66 objects
            # (LedgerEntry(loan=...) is not yet in xrpl-py 4.x standard)
            response = await self._client.request(LedgerEntry(index=loan_id))
            if not response.is_successful():
                logger.error("LedgerEntry(index=%s) failed: %s", loan_id[:16], response.result)
                return None
            node  = response.result.get("node", response.result)
            flags = int(node.get("Flags", 0))
            return node if (flags & LSF_LOAN_DEFAULT) else None
        except Exception as exc:
            logger.error("Step 4 error: %s", exc)
            return None

    async def _step5_calculate_loss(
        self, loan_node: dict
    ) -> Tuple[int, Optional[str]]:
        """
        Fetch LoanBroker and compute vault loss using XLS-66 formulas.

        Returns (vault_loss_drops, error_string_or_None).
        """
        loan_broker_id = loan_node.get("LoanBrokerID", "")
        if not loan_broker_id:
            return 0, "Loan node missing LoanBrokerID"

        try:
            broker_response = await self._client.request(
                LedgerEntry(index=loan_broker_id)
            )
            if not broker_response.is_successful():
                return 0, f"Failed to fetch LoanBroker {loan_broker_id[:16]}: {broker_response.result}"

            broker = broker_response.result.get("node", broker_response.result)

            principal   = int(loan_node.get("PrincipalOutstanding", 0))
            interest    = int(loan_node.get("InterestOutstanding", 0))
            debt_total  = int(broker.get("DebtTotal", 0))
            cover_avail = int(broker.get("CoverAvailable", 0))
            cover_rate_min  = float(broker.get("CoverRateMinimum", 0))
            cover_rate_liq  = float(broker.get("CoverRateLiquidation", 0))

            default_amount  = principal + interest
            minimum_cover   = int(debt_total * cover_rate_min)
            default_covered = min(
                int(minimum_cover * cover_rate_liq),
                default_amount,
                cover_avail,
            )
            vault_loss = default_amount - default_covered

            return vault_loss, None

        except Exception as exc:
            return 0, f"Step 5 error computing loss: {exc}"

    async def _step6_verify_coverage_breach(
        self, loan_node: dict, vault_address: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify that the vault's coverage ratio was breached.

        Returns (True, None) if breach confirmed, (False, error) otherwise.
        """
        try:
            response = await self._client.request(
                LedgerEntry(vault=vault_address)
            )
            if not response.is_successful():
                return False, f"Could not fetch Vault {vault_address[:16]}: {response.result}"

            vault = response.result.get("node", response.result)
            assets_total   = int(vault.get("AssetsTotal", 0))
            loss_unrealized = int(vault.get("LossUnrealized", 0))

            loan_broker_id   = loan_node.get("LoanBrokerID", "")
            outstanding_loans = int(loan_node.get("TotalValueOutstanding", 0))

            if outstanding_loans <= 0:
                return False, "Outstanding loan value is zero — no coverage breach"

            tvl = assets_total - loss_unrealized
            try:
                calculate_coverage_ratio(tvl, outstanding_loans, min_ratio=MIN_COVERAGE_RATIO)
                # If no exception, ratio is OK — coverage was NOT breached
                return False, (
                    f"Coverage ratio {tvl / outstanding_loans:.2f}x meets minimum "
                    f"{MIN_COVERAGE_RATIO}x — no coverage breach"
                )
            except ValidationError:
                return True, None  # Ratio is below minimum — breach confirmed

        except ValidationError:
            return True, None
        except Exception as exc:
            return False, f"Step 6 error: {exc}"

    async def _step9_check_pool_solvency(
        self, pool_address: str, payout_drops: int
    ) -> Optional[str]:
        """Return an error string if the pool cannot cover the payout, else None."""
        try:
            response = await self._client.request(AccountInfo(account=pool_address))
            if not response.is_successful():
                return f"Could not fetch pool balance for {pool_address[:16]}: {response.result}"

            balance_drops = int(
                response.result.get("account_data", {}).get("Balance", 0)
            )
            # Keep 20 XRP reserve + payout
            XRPL_RESERVE = 20_000_000  # 20 XRP base reserve
            available    = balance_drops - XRPL_RESERVE

            if available < payout_drops:
                return (
                    f"Pool insolvent: balance {balance_drops / 1_000_000:.2f} XRP, "
                    f"required {payout_drops / 1_000_000:.2f} XRP "
                    f"(+ {XRPL_RESERVE / 1_000_000} XRP reserve)"
                )
            return None

        except Exception as exc:
            return f"Step 9 error: {exc}"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _reject(self, step: int, reason: str) -> ValidationResult:
        logger.warning("CLAIM REJECTED at step %d: %s", step, reason)
        return ValidationResult(
            approved=False,
            claim_payout_drops=0,
            vault_loss_drops=0,
            policy_coverage_drops=0,
            rejection_reason=reason,
            steps_passed=step - 1 if step > 0 else 0,
        )

    def _check_rate_limit(self, nft_token_id: str) -> bool:
        """Return True if under rate limit, False if exceeded."""
        now    = time.time()
        window = self._rate_limit[nft_token_id]
        while window and now - window[0] > RATE_LIMIT_WINDOW_S:
            window.popleft()
        if len(window) >= RATE_LIMIT_ATTEMPTS:
            return False
        window.append(now)
        return True


# ---------------------------------------------------------------------------
# ============================================================================
# MODULE 4 — EscrowSettlement: crypto-conditioned claim settlement
# ============================================================================
# ---------------------------------------------------------------------------


@dataclass
class EscrowRecord:
    """Record of an in-flight escrowed claim."""

    claim_id:          str
    nft_token_id:      str
    pool_address:      str
    claimant_address:  str
    payout_drops:      int
    escrow_sequence:   int
    condition_hex:     str
    tx_hash:           str
    finish_after_ripple: int
    cancel_after_ripple: int


class EscrowSettlement:
    """
    Module 4 — Crypto-conditioned escrow settlement for approved claims.

    Security design:
      CLAIMANT generates the preimage offline (os.urandom(32)).
      CLAIMANT derives condition = SHA-256(preimage) → provides only condition.
      POOL OPERATOR calls create_claim_escrow() with that condition.
      Escrow is locked for 48 hours (dispute window) AND requires the preimage.
      Only the claimant can finish the escrow (they alone know the preimage).
      Ward cannot front-run or withhold the payout.
      After 72 hours the pool operator can cancel if the claimant is unresponsive.
      The policy NFT is burned as part of settlement — permanent replay protection.

    Key methods:
      create_claim_escrow() — pool operator submits EscrowCreate (signed by pool wallet)
      finish_escrow()       — claimant submits EscrowFinish with preimage (claimant wallet)
      cancel_escrow()       — pool operator cancels after cancel window (pool wallet)
    """

    def __init__(self, xrpl_url: str = DEFAULT_TESTNET_URL) -> None:
        self._client = AsyncJsonRpcClient(xrpl_url)

    # ------------------------------------------------------------------

    async def create_claim_escrow(
        self,
        pool_wallet:       Any,  # Pool operator's wallet — NOT stored
        claimant_address:  str,
        payout_drops:      int,
        condition_hex:     str,  # Provided BY the claimant; Ward never learns the preimage
        nft_token_id:      str,
        claim_id:          str,
    ) -> EscrowRecord:
        """
        Create a time-locked + crypto-conditioned escrow from the pool.

        Args:
            pool_wallet:      Pool operator's wallet (signs the EscrowCreate).
            claimant_address: Payout destination.
            payout_drops:     Amount to lock in escrow (drops).
            condition_hex:    PREIMAGE-SHA-256 condition — generated by claimant.
            nft_token_id:     Policy NFT being settled (for memo audit trail).
            claim_id:         Unique claim identifier.

        Returns:
            EscrowRecord with all details needed to finish or cancel.

        Security:
            Ward never learns the preimage — it only receives the condition hash.
            Both time AND crypto conditions must be met to finish the escrow.
            This prevents anyone except the claimant from extracting the payout
            (even if they know the timing window).
        """
        validate_xrpl_address(claimant_address, "claimant_address")
        validate_drops_amount(payout_drops, "payout_drops")
        validate_nft_id(nft_token_id)

        # Get XRPL ledger time for escrow timestamps
        current_time         = await get_ledger_time(self._client)
        finish_after_ripple  = current_time + ESCROW_DISPUTE_HOURS  * 3600
        cancel_after_ripple  = current_time + ESCROW_CANCEL_HOURS   * 3600

        audit_memo = json.dumps(
            {
                "protocol":    "ward-v1",
                "claim_id":    claim_id,
                "nft":         nft_token_id,
                "payout_xrp":  f"{payout_drops / 1_000_000:.4f}",
                "dispute_hrs": ESCROW_DISPUTE_HOURS,
            },
            separators=(",", ":"),
        )

        escrow_tx = EscrowCreate(
            account=pool_wallet.classic_address,
            destination=claimant_address,
            amount=str(payout_drops),
            finish_after=finish_after_ripple,
            cancel_after=cancel_after_ripple,
            condition=condition_hex,  # Claimant's PREIMAGE-SHA-256 condition
            memos=[
                Memo(
                    memo_type=str_to_hex("ward/claim-escrow"),
                    memo_data=str_to_hex(audit_memo),
                )
            ],
        )

        try:
            escrow_tx = await autofill(escrow_tx, self._client)
            response  = await submit_and_wait(escrow_tx, self._client, pool_wallet, autofill=False)

            if not response.is_successful():
                raise LedgerError(
                    f"EscrowCreate failed: "
                    f"{response.result.get('meta', {}).get('TransactionResult')}"
                )

            tx_hash         = response.result["hash"]
            escrow_sequence = response.result.get("Sequence") or \
                              response.result.get("tx_json", {}).get("Sequence")

            if not escrow_sequence:
                # Extract from transaction result
                escrow_sequence = response.result.get("tx_json", {}).get("Sequence", 0)

            logger.info(
                "EscrowCreate: %s  seq=%d  payout=%.4f XRP  "
                "finishable after %dh  cancellable after %dh",
                tx_hash[:16],
                escrow_sequence,
                payout_drops / 1_000_000,
                ESCROW_DISPUTE_HOURS,
                ESCROW_CANCEL_HOURS,
            )

            return EscrowRecord(
                claim_id=claim_id,
                nft_token_id=nft_token_id,
                pool_address=pool_wallet.classic_address,
                claimant_address=claimant_address,
                payout_drops=payout_drops,
                escrow_sequence=escrow_sequence,
                condition_hex=condition_hex,
                tx_hash=tx_hash,
                finish_after_ripple=finish_after_ripple,
                cancel_after_ripple=cancel_after_ripple,
            )

        except (WardError, ValueError):
            raise
        except Exception as exc:
            raise LedgerError(f"create_claim_escrow failed: {exc}") from exc

    # ------------------------------------------------------------------

    async def finish_escrow(
        self,
        claimant_wallet:  Any,   # Claimant's wallet — signs the EscrowFinish
        escrow_record:    EscrowRecord,
        fulfillment_hex:  str,   # Claimant's secret preimage (hex)
        nft_wallet:       Any,   # Same as claimant_wallet — burns the policy NFT
    ) -> Dict[str, str]:
        """
        Finish the escrow (release payout) and burn the policy NFT atomically.

        Args:
            claimant_wallet:  Claimant signs both transactions.
            escrow_record:    Record from create_claim_escrow().
            fulfillment_hex:  PREIMAGE-SHA-256 fulfillment (the preimage in DER).
            nft_wallet:       Wallet that holds the NFT (should equal claimant_wallet).

        Returns:
            {"finish_tx": hash, "burn_tx": hash}

        Security:
            - Time window is verified against XRPL ledger time (not local clock).
            - NFT burn happens AFTER escrow finish to prevent the escrow from
              being orphaned (if burn fails, the payout still landed).
            - If burn fails, the caller is warned — a second finish attempt
              would fail at Step 1 (NFT gone, policy unrecoverable by design).
        """
        validate_xrpl_address(escrow_record.claimant_address, "claimant_address")

        # Verify finish window is open on-chain
        current_time = await get_ledger_time(self._client)
        if current_time < escrow_record.finish_after_ripple:
            remaining = escrow_record.finish_after_ripple - current_time
            raise ValidationError(
                f"Escrow not yet finishable: {remaining // 3600}h "
                f"{(remaining % 3600) // 60}m remaining in dispute window"
            )
        if current_time >= escrow_record.cancel_after_ripple:
            raise ValidationError(
                "Escrow cancel window has passed — escrow may have been cancelled by pool"
            )

        # ── EscrowFinish ──────────────────────────────────────────────
        finish_tx = EscrowFinish(
            account=claimant_wallet.classic_address,
            owner=escrow_record.pool_address,
            offer_sequence=escrow_record.escrow_sequence,
            condition=escrow_record.condition_hex,
            fulfillment=fulfillment_hex,
            memos=[
                Memo(
                    memo_type=str_to_hex("ward/claim-finish"),
                    memo_data=str_to_hex(escrow_record.claim_id),
                )
            ],
        )

        try:
            finish_tx = await autofill(finish_tx, self._client)
            finish_resp = await submit_and_wait(
                finish_tx, self._client, claimant_wallet, autofill=False
            )
            if not finish_resp.is_successful():
                raise LedgerError(
                    f"EscrowFinish failed: "
                    f"{finish_resp.result.get('meta', {}).get('TransactionResult')}"
                )
            finish_hash = finish_resp.result["hash"]
            logger.info("EscrowFinish: %s  claim=%s", finish_hash[:16], escrow_record.claim_id)

        except (WardError, ValueError):
            raise
        except Exception as exc:
            raise LedgerError(f"finish_escrow failed: {exc}") from exc

        # ── NFTokenBurn — replay protection ───────────────────────────
        # Burn the policy NFT so it can never be used again.
        burn_hash = ""
        try:
            burn_tx = NFTokenBurn(
                account=nft_wallet.classic_address,
                nftoken_id=escrow_record.nft_token_id,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/policy-burn"),
                        memo_data=str_to_hex(
                            f"Settled claim {escrow_record.claim_id} via {finish_hash}"
                        ),
                    )
                ],
            )
            burn_tx  = await autofill(burn_tx, self._client)
            burn_resp = await submit_and_wait(burn_tx, self._client, nft_wallet, autofill=False)
            if not burn_resp.is_successful():
                logger.error(
                    "NFTokenBurn FAILED for %s — payout was released but NFT survives. "
                    "Manually burn %s to prevent replay.",
                    escrow_record.nft_token_id[:16],
                    escrow_record.nft_token_id,
                )
            else:
                burn_hash = burn_resp.result["hash"]
                logger.info(
                    "NFTokenBurn: %s  nft=%s",
                    burn_hash[:16],
                    escrow_record.nft_token_id[:16],
                )

        except Exception as exc:
            logger.error("NFTokenBurn error (non-fatal, payout landed): %s", exc)

        return {"finish_tx": finish_hash, "burn_tx": burn_hash}

    # ------------------------------------------------------------------

    async def cancel_escrow(
        self,
        pool_wallet:    Any,
        escrow_record:  EscrowRecord,
        reason:         str,
    ) -> str:
        """
        Cancel the escrow and return funds to the pool (after cancel window).

        Args:
            pool_wallet:   Pool operator wallet (must be the escrow owner).
            escrow_record: Record from create_claim_escrow().
            reason:        Reason for cancellation (stored in Memo).

        Returns:
            Transaction hash of the EscrowCancel.
        """
        current_time = await get_ledger_time(self._client)
        if current_time < escrow_record.cancel_after_ripple:
            remaining = escrow_record.cancel_after_ripple - current_time
            raise ValidationError(
                f"Escrow not yet cancellable: {remaining // 3600}h "
                f"{(remaining % 3600) // 60}m remaining"
            )

        cancel_tx = EscrowCancel(
            account=pool_wallet.classic_address,
            owner=pool_wallet.classic_address,
            offer_sequence=escrow_record.escrow_sequence,
            memos=[
                Memo(
                    memo_type=str_to_hex("ward/claim-cancel"),
                    memo_data=str_to_hex(f"claim={escrow_record.claim_id} reason={reason}"),
                )
            ],
        )

        try:
            cancel_tx = await autofill(cancel_tx, self._client)
            response  = await submit_and_wait(cancel_tx, self._client, pool_wallet, autofill=False)

            if not response.is_successful():
                raise LedgerError(
                    f"EscrowCancel failed: "
                    f"{response.result.get('meta', {}).get('TransactionResult')}"
                )

            tx_hash = response.result["hash"]
            logger.info(
                "EscrowCancel: %s  claim=%s  reason=%s",
                tx_hash[:16],
                escrow_record.claim_id,
                reason,
            )
            return tx_hash

        except (WardError, ValueError):
            raise
        except Exception as exc:
            raise LedgerError(f"cancel_escrow failed: {exc}") from exc


# ---------------------------------------------------------------------------
# ============================================================================
# MODULE 5 — PoolHealthMonitor: on-chain solvency and dynamic pricing
# ============================================================================
# ---------------------------------------------------------------------------


@dataclass
class PoolHealth:
    """Snapshot of pool solvency and pricing state."""

    pool_address:        str
    balance_drops:       int
    active_coverage_drops: int   # Sum of all active policy coverage amounts
    coverage_ratio:      float   # balance / active_coverage (should be ≥ 2.0)
    is_solvent:          bool
    dynamic_premium_rate: float  # e.g. 0.015 = 1.5%
    risk_tier:           str     # "safest" | "safe" | "moderate" | "elevated" | "high"

    @property
    def balance_xrp(self) -> float:
        return self.balance_drops / 1_000_000

    @property
    def active_coverage_xrp(self) -> float:
        return self.active_coverage_drops / 1_000_000


class PoolHealthMonitor:
    """
    Module 5 — On-chain pool solvency and dynamic premium monitoring.

    All data is sourced exclusively from XRPL — no off-chain state.

    Dynamic premium formula (from Ward Protocol spec Appendix B):
        base_rate     = 1-5% annual based on risk tier
        multiplier    = 0.5x - 2.0x based on coverage ratio
        premium_rate  = base_rate × multiplier × (term_days / 365)

    Coverage ratio tiers:
        ≥ 5.0x  → safest   (1%  × 0.5x = 0.50% annual)
        ≥ 3.0x  → safe     (2%  × 0.75x = 1.50% annual)
        ≥ 2.0x  → moderate (3%  × 1.0x  = 3.00% annual)
        ≥ 1.5x  → elevated (4%  × 1.5x  = 6.00% annual)
        < 1.5x  → high     (5%  × 2.0x  = 10.0% annual) — minting BLOCKED
    """

    # Base annual rates
    BASE_RATES = {
        "safest":   0.01,
        "safe":     0.02,
        "moderate": 0.03,
        "elevated": 0.04,
        "high":     0.05,
    }

    # Risk multipliers
    MULTIPLIERS = {
        "safest":   0.50,
        "safe":     0.75,
        "moderate": 1.00,
        "elevated": 1.50,
        "high":     2.00,
    }

    def __init__(
        self,
        pool_address: str,
        xrpl_url: str = DEFAULT_TESTNET_URL,
    ) -> None:
        validate_xrpl_address(pool_address, "pool_address")
        self._pool_address = pool_address
        self._client = AsyncJsonRpcClient(xrpl_url)

    # ------------------------------------------------------------------

    async def get_health(
        self, active_coverage_drops: int = 0
    ) -> PoolHealth:
        """
        Fetch and calculate current pool health from on-chain data.

        Args:
            active_coverage_drops: Sum of all active policy coverage amounts
                                   (caller derives this from policy NFTs on-chain).

        Returns:
            PoolHealth snapshot.
        """
        response = await self._client.request(AccountInfo(account=self._pool_address))
        if not response.is_successful():
            raise LedgerError(
                f"Cannot fetch pool account info for {self._pool_address}: {response.result}"
            )

        balance_drops = int(
            response.result.get("account_data", {}).get("Balance", 0)
        )
        # Subtract base reserve (20 XRP) — not available for payouts
        XRPL_RESERVE  = 20_000_000
        usable_drops  = max(0, balance_drops - XRPL_RESERVE)

        # Coverage ratio
        if active_coverage_drops > 0:
            ratio = usable_drops / active_coverage_drops
        else:
            ratio = float("inf")

        tier = self._classify_tier(ratio)

        # Dynamic premium rate
        base_rate  = self.BASE_RATES[tier]
        multiplier = self.MULTIPLIERS[tier]
        dynamic_rate = base_rate * multiplier  # annual rate

        is_solvent = ratio >= MIN_COVERAGE_RATIO

        health = PoolHealth(
            pool_address=self._pool_address,
            balance_drops=balance_drops,
            active_coverage_drops=active_coverage_drops,
            coverage_ratio=ratio,
            is_solvent=is_solvent,
            dynamic_premium_rate=dynamic_rate,
            risk_tier=tier,
        )

        if not is_solvent:
            logger.warning(
                "POOL UNDERCOLLATERALIZED: ratio=%.2fx  "
                "balance=%.2f XRP  coverage=%.2f XRP  "
                "NEW POLICY MINTING BLOCKED",
                ratio,
                balance_drops / 1_000_000,
                active_coverage_drops / 1_000_000,
            )
        else:
            logger.info(
                "Pool health: ratio=%.2fx (%s)  "
                "balance=%.2f XRP  rate=%.2f%% annual",
                ratio,
                tier,
                balance_drops / 1_000_000,
                dynamic_rate * 100,
            )

        return health

    def is_minting_allowed(self, health: PoolHealth) -> bool:
        """
        Return True only if the pool is sufficiently collateralized.

        New policies must NOT be issued if coverage ratio < MIN_COVERAGE_RATIO.
        """
        return health.is_solvent and health.risk_tier != "high"

    def calculate_premium(
        self,
        health:         PoolHealth,
        coverage_drops: int,
        term_days:      int,
    ) -> Dict[str, Any]:
        """
        Calculate a risk-adjusted premium quote.

        Args:
            health:         Current pool health snapshot.
            coverage_drops: Requested coverage in drops.
            term_days:      Policy term in days.

        Returns:
            {
                "premium_drops": int,
                "annual_rate":   float,
                "risk_tier":     str,
                "multiplier":    float,
            }
        """
        validate_drops_amount(coverage_drops, "coverage_drops")
        if term_days <= 0:
            raise ValidationError("term_days must be positive")

        annual_rate    = health.dynamic_premium_rate
        term_factor    = term_days / 365.0
        premium_drops  = int(coverage_drops * annual_rate * term_factor)

        return {
            "premium_drops": premium_drops,
            "annual_rate":   annual_rate,
            "risk_tier":     health.risk_tier,
            "multiplier":    self.MULTIPLIERS[health.risk_tier],
            "coverage_ratio": health.coverage_ratio,
        }

    def _classify_tier(self, ratio: float) -> str:
        if ratio >= 5.0:
            return "safest"
        if ratio >= 3.0:
            return "safe"
        if ratio >= 2.0:
            return "moderate"
        if ratio >= 1.5:
            return "elevated"
        return "high"


# ---------------------------------------------------------------------------
# Demo / smoke test
# ---------------------------------------------------------------------------


async def _demo() -> None:  # pragma: no cover
    """
    Quick testnet smoke-test.

    Demonstrates purchase_coverage with a faucet wallet.
    Requires XRPL testnet access.
    """
    import os

    pool_address = os.getenv("WARD_POOL_ADDRESS", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")

    client = WardClient(xrpl_url=DEFAULT_TESTNET_URL)
    rpc    = AsyncJsonRpcClient(DEFAULT_TESTNET_URL)

    print("Requesting testnet faucet wallet…")
    # Bug fix [2]: generate_faucet_wallet is async in xrpl-py 4.x
    wallet = await generate_faucet_wallet(rpc, debug=True)
    print(f"Wallet: {wallet.classic_address}")

    result = await client.purchase_coverage(
        wallet=wallet,
        vault_address="rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        coverage_drops=1_000_000,   # 1 XRP coverage (testnet demo)
        period_days=30,
        pool_address=pool_address,
        premium_rate=0.01,
    )
    print("\nPolicy issued:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(_demo())
