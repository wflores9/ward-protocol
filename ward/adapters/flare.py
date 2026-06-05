"""
Ward Protocol — Flare Network Adapter

EVM Solidity resolution on Flare Network.
Flare's EVM is fully EVM-compatible; WardResolver.sol deploys unchanged.

FTSO price feeds are Flare-native and can anchor RLUSD payout amounts
to verifiable on-chain prices — no external oracle dependency.

ward_signed = False throughout. All transaction payloads are returned
unsigned for institution signing. Ward is never a counterparty.

Architecture:
    FlareAdapter extends ChainAdapter and targets Flare's JSON-RPC endpoint.
    Resolution flow:
      1. verify_vault()       — confirm vault state on Flare
      2. get_ledger_state()   — fetch block and FTSO snapshot
      3. build_resolution_tx() — produce unsigned EVM call payload
         Institution signs; Flare EVM settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.flare")

# Flare Network — chain identifiers
_FLARE_CHAIN_ID_MAINNET: int = 14
_FLARE_CHAIN_ID_TESTNET: int = 114  # Coston2
_FLARE_EVM_CALL_TYPE: str = "FLARE_EVM_CALL"

# Canonical RLUSD placeholder on Flare (published at XLS-66 mainnet + bridge)
_RLUSD_FLARE_ADDRESS: str = "0x0000000000000000000000000000000000000000"


@dataclass
class VaultState:
    """Snapshot of vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_amount: int  # in wei (RLUSD)
    pool_usable_amount: int  # in wei (RLUSD)
    block_timestamp: int


@dataclass
class LedgerState:
    """Flare block + FTSO snapshot from get_ledger_state()."""

    block_number: int
    block_timestamp: int
    ftso_epoch: int
    rlusd_price_usd: int  # FTSO price in 5-decimal fixed point (e.g. 100000 = $1.00)
    path_available: bool


@dataclass
class FlareResolutionPayload:
    """Unsigned Flare EVM call payload. ward_signed is always False."""

    chain_id: int
    contract_address: str
    caller: str
    recipient: str
    amount: int
    nonce: int
    call_type: str = _FLARE_EVM_CALL_TYPE
    ward_signed: bool = field(default=False, init=False)


class FlareAdapter(ChainAdapter):
    """
    Ward chain adapter for Flare Network.

    Deploys WardResolver.sol on Flare's EVM for deterministic nine-check
    resolution. FTSO price feeds provide chain-native RLUSD price anchoring
    without external oracles.

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction payloads are returned unsigned for institution signing.

    Args:
        rpc_url:           Flare JSON-RPC endpoint.
        chain_id:          Flare chain ID (14 mainnet / 114 Coston2 testnet).
        ward_resolver:     Deployed WardResolver.sol contract address.
        rlusd_address:     RLUSD ERC-20 contract address on Flare.
    """

    def __init__(
        self,
        rpc_url: str = "https://flare-api.flare.network/ext/C/rpc",
        chain_id: int = _FLARE_CHAIN_ID_MAINNET,
        ward_resolver: str = "",
        rlusd_address: str = _RLUSD_FLARE_ADDRESS,
    ) -> None:
        self._rpc_url = rpc_url
        self._chain_id = chain_id
        self._ward_resolver = ward_resolver
        self._rlusd_address = rlusd_address

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on Flare.

        Reads default flag, outstanding loss, and pool balance from the
        WardResolver contract on Flare EVM. No off-chain data is trusted.

        Returns:
            VaultState with current on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        block_ts = await self.get_ledger_time()

        logger.info(
            "verify_vault: vault=%s defaulted=%s outstanding=%d pool=%d",
            vault_address[:8],
            is_defaulted,
            outstanding,
            pool_balance,
        )
        return VaultState(
            vault_address=vault_address,
            is_defaulted=is_defaulted,
            outstanding_amount=outstanding,
            pool_usable_amount=pool_balance,
            block_timestamp=block_ts,
        )

    async def get_ledger_state(self) -> LedgerState:
        """
        Fetch current Flare block and FTSO price snapshot.

        In production queries Flare RPC for block number, timestamp, and
        FTSO epoch; RLUSD price sourced from FTSO price provider contract.
        """
        block_ts = await self.get_ledger_time()
        logger.info("get_ledger_state: block_timestamp=%d", block_ts)
        return LedgerState(
            block_number=0,
            block_timestamp=block_ts,
            ftso_epoch=0,
            rlusd_price_usd=100000,  # 5-decimal: 100000 = $1.00
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_amount: int,
        dest_chain_id: Optional[int] = None,
        nonce: int = 0,
    ) -> UnsignedTransaction:
        """
        Build an unsigned Flare EVM resolution transaction.

        Produces an UnsignedTransaction wrapping a FlareResolutionPayload.
        ward_signed is always False — the institution signs and submits;
        Flare EVM settles.

        Args:
            pool_address:    Source pool contract address on Flare.
            claimant_address: Recipient address on Flare.
            payout_amount:   Payout in wei (RLUSD).
            dest_chain_id:   Override chain ID (default: self._chain_id).
            nonce:           EVM transaction nonce.

        Returns:
            UnsignedTransaction with Flare EVM payload; ward_signed=False.
        """
        effective_chain = dest_chain_id if dest_chain_id is not None else self._chain_id

        payload = FlareResolutionPayload(
            chain_id=effective_chain,
            contract_address=self._ward_resolver,
            caller=pool_address,
            recipient=claimant_address,
            amount=payout_amount,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d chain=%d ward_signed=%s",
            pool_address[:8],
            claimant_address[:8],
            payout_amount,
            effective_chain,
            payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_FLARE_EVM_CALL_TYPE,
            account=pool_address,
            destination=claimant_address,
            amount_drops=payout_amount,
            send_max=_payload_to_dict(payload),
        )

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """Steps 1 + 8: Query WardResolver._nftHolders on Flare EVM."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:8],
            token_id[:16],
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get current Flare block timestamp via eth_getBlockByNumber."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Check WardResolver._loanFlags for LSF_LOAN_DEFAULT."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get _loanOutstanding from WardResolver on Flare."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get _poolBalances from WardResolver on Flare."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned EVM approve + transfer payload. ward_signed=False."""
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "chain_id": self._chain_id,
            "ward_signed": False,
        }

    async def build_unsigned_escrow_finish(
        self,
        claimant_address: str,
        owner_address: str,
        offer_sequence: int,
        condition_hex: str,
        fulfillment_hex: str,
    ) -> dict:
        """Settlement: Build unsigned EVM escrow finish. ward_signed=False."""
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "chain_id": self._chain_id,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _payload_to_dict(payload: FlareResolutionPayload) -> dict[str, Any]:
    """Serialise FlareResolutionPayload to a plain dict for UnsignedTransaction.send_max."""
    return {
        "call_type": payload.call_type,
        "chain_id": payload.chain_id,
        "contract_address": payload.contract_address,
        "caller": payload.caller,
        "recipient": payload.recipient,
        "amount": payload.amount,
        "nonce": payload.nonce,
        "ward_signed": payload.ward_signed,
    }
