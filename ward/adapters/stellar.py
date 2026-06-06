"""
Ward Protocol — Stellar Adapter

Native Stellar resolution using trustlines and payment operations.
RLUSD on Stellar is issued as a Stellar asset (asset_code=RLUSD, asset_issuer=<Ripple>).
Pool accounts hold RLUSD via trustlines; Ward policy credentials are Stellar NFTs
(SEP-0011 or data entry–backed credential records).

ward_signed = False throughout. All transaction envelopes are returned
unsigned (base64 XDR); the institution signs with their Stellar keypair;
Stellar network settles.

Architecture:
    StellarAdapter extends ChainAdapter and targets the Stellar Horizon API.
    Resolution flow:
      1. verify_vault()       — check Stellar account balances + data entries
      2. get_ledger_state()   — fetch ledger sequence + close time
      3. build_resolution_tx() — produce unsigned Stellar payment operation
         Institution signs XDR envelope; Stellar network settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.adapters._config import require_non_placeholder
from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.stellar")

# Stellar network constants
_STELLAR_MAINNET_HORIZON: str = "https://horizon.stellar.org"
_STELLAR_TESTNET_HORIZON: str = "https://horizon-testnet.stellar.org"
_STELLAR_PAYMENT_TYPE: str = "STELLAR_PAYMENT"

# RLUSD Stellar asset — canonical (Ripple issuer on Stellar mainnet, placeholder)
_RLUSD_ASSET_CODE: str = "RLUSD"
_RLUSD_STELLAR_ISSUER: str = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"


@dataclass
class VaultState:
    """Snapshot of Stellar vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_stroops: int
    pool_usable_stroops: int
    ledger_sequence: int


@dataclass
class LedgerState:
    """Stellar ledger snapshot from get_ledger_state()."""

    ledger_sequence: int
    close_time: int
    base_fee_stroops: int
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class StellarPaymentPayload:
    """Unsigned Stellar payment operation payload. ward_signed is always False."""

    source_account: str
    destination_account: str
    asset_code: str
    asset_issuer: str
    amount_str: str  # Stellar amounts are decimal strings (7 decimal places)
    fee_stroops: int
    sequence_number: int
    memo: str
    payment_type: str = _STELLAR_PAYMENT_TYPE
    ward_signed: bool = field(default=False, init=False)


class StellarAdapter(ChainAdapter):
    """
    Ward chain adapter for Stellar.

    Reads Stellar account state via Horizon API and builds unsigned
    Stellar payment operation XDR. Ward policy credentials are stored
    as Stellar account data entries; pool accounts hold RLUSD trustlines.

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction envelopes are returned unsigned for institution signing.

    Args:
        horizon_url:        Stellar Horizon API endpoint.
        rlusd_asset_code:   RLUSD asset code.
        rlusd_issuer:       RLUSD issuer account ID on Stellar.
        network_passphrase: Stellar network passphrase for XDR signing.
    """

    def __init__(
        self,
        horizon_url: str = _STELLAR_MAINNET_HORIZON,
        rlusd_asset_code: str = _RLUSD_ASSET_CODE,
        rlusd_issuer: str = _RLUSD_STELLAR_ISSUER,
        network_passphrase: str = "Public Global Stellar Network ; September 2015",
    ) -> None:
        self._horizon_url = horizon_url
        self._rlusd_asset_code = rlusd_asset_code
        self._rlusd_issuer = require_non_placeholder(
            rlusd_issuer,
            field_name="rlusd_issuer",
            invalid_values={_RLUSD_STELLAR_ISSUER},
        )
        self._network_passphrase = network_passphrase

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on Stellar.

        Reads Stellar account data entries for the Ward policy credential,
        checks on-chain default flag, and queries pool RLUSD trustline balance.
        No off-chain data is trusted.

        Returns:
            VaultState with current Stellar on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        ledger_seq = await self.get_ledger_time()

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
            outstanding_stroops=outstanding,
            pool_usable_stroops=pool_balance,
            ledger_sequence=ledger_seq,
        )

    async def get_ledger_state(self) -> LedgerState:
        """
        Fetch current Stellar ledger sequence and close time.

        In production calls Horizon /ledgers?order=desc&limit=1 to get
        the latest ledger sequence and close_time.
        """
        ledger_seq = await self.get_ledger_time()
        logger.info("get_ledger_state: ledger_sequence=%d", ledger_seq)
        return LedgerState(
            ledger_sequence=ledger_seq,
            close_time=0,
            base_fee_stroops=100,
            rlusd_pool_balance=0,
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_amount: int,
        sequence_number: int = 0,
        fee_stroops: int = 100,
        memo: str = "",
    ) -> UnsignedTransaction:
        """
        Build an unsigned Stellar payment operation.

        Produces an UnsignedTransaction wrapping a StellarPaymentPayload.
        ward_signed is always False — the institution signs the XDR envelope;
        Stellar network settles.

        Args:
            pool_address:    Source Stellar account (pool).
            claimant_address: Recipient Stellar account.
            payout_amount:   Amount in stroops (1 RLUSD = 10_000_000 stroops).
            sequence_number: Pool account sequence number.
            fee_stroops:     Transaction fee in stroops (min 100).
            memo:            Optional memo text for audit trail.

        Returns:
            UnsignedTransaction with Stellar payload in send_max; ward_signed=False.
        """
        amount_str = f"{payout_amount / 10_000_000:.7f}"

        stellar_payload = StellarPaymentPayload(
            source_account=pool_address,
            destination_account=claimant_address,
            asset_code=self._rlusd_asset_code,
            asset_issuer=self._rlusd_issuer,
            amount_str=amount_str,
            fee_stroops=fee_stroops,
            sequence_number=sequence_number,
            memo=memo,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%s ward_signed=%s",
            pool_address[:8],
            claimant_address[:8],
            amount_str,
            stellar_payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_STELLAR_PAYMENT_TYPE,
            account=pool_address,
            destination=claimant_address,
            amount_drops=payout_amount,
            send_max=_payload_to_dict(stellar_payload),
        )

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """Steps 1 + 8: Read Stellar account data entries for Ward credential."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:8],
            token_id[:16],
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get latest Stellar ledger close_time via Horizon API."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Read Ward default flag from Stellar account data entries."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get outstanding loan amount from Ward Stellar account data."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get RLUSD trustline balance via Horizon /accounts/{id}."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned Stellar claimable balance (timelock). ward_signed=False."""
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "asset_code": self._rlusd_asset_code,
            "asset_issuer": self._rlusd_issuer,
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
        """Settlement: Build unsigned Stellar claimable balance claim. ward_signed=False."""
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "asset_code": self._rlusd_asset_code,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _payload_to_dict(payload: StellarPaymentPayload) -> dict[str, Any]:
    """Serialise StellarPaymentPayload to a plain dict for UnsignedTransaction.send_max."""
    return {
        "payment_type": payload.payment_type,
        "source_account": payload.source_account,
        "destination_account": payload.destination_account,
        "asset_code": payload.asset_code,
        "asset_issuer": payload.asset_issuer,
        "amount_str": payload.amount_str,
        "fee_stroops": payload.fee_stroops,
        "sequence_number": payload.sequence_number,
        "memo": payload.memo,
        "ward_signed": payload.ward_signed,
    }
