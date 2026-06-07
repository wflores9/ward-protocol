"""
Ward Protocol — Wormhole NTT Adapter

Cross-chain RLUSD resolution via Wormhole Native Token Transfers.
No wrapping — RLUSD issuer control is preserved on every connected chain.

ward_signed = False throughout. NTT transfer payloads are returned unsigned;
the institution signs, Wormhole Guardians attest, the destination chain settles.
Ward is never a counterparty.

Architecture:
    WormholeNTTAdapter extends ChainAdapter and targets two RPC endpoints:
      - source_rpc_url:  origin chain (XRPL Altnet / Mainnet)
      - dest_rpc_url:    destination chain (EVM, Solana, etc.)

    Resolution flow:
      1. verify_vault()      — confirm vault state on source chain
      2. get_ledger_state()  — fetch cross-chain state snapshot
      3. build_resolution_tx() — produce unsigned NTT transfer payload
         Institution signs; Guardian network attests; destination settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.wormhole")

# Wormhole NTT — canonical RLUSD contract identifiers (placeholder until mainnet)
_RLUSD_XRPL_CURRENCY: str = (
    "524C555344000000000000000000000000000000"  # "RLUSD" hex-padded
)
_RLUSD_ISSUER_MAINNET: str = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De"
_WORMHOLE_CHAIN_ID_XRPL: int = 25  # Wormhole chain ID for XRPL
_NTT_TRANSFER_TYPE: str = "NTT_TRANSFER"


@dataclass
class VaultState:
    """Snapshot of on-chain vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_drops: int
    pool_usable_drops: int
    ledger_time: int


@dataclass
class LedgerState:
    """Cross-chain state snapshot from get_ledger_state()."""

    source_chain_time: int
    dest_chain_block: int
    guardian_set_index: int
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class NTTTransferPayload:
    """Unsigned Wormhole NTT transfer payload. ward_signed is always False."""

    source_chain_id: int
    dest_chain_id: int
    source_token: str
    dest_token: str
    sender: str
    recipient: str
    amount: int
    nonce: int
    transfer_type: str = _NTT_TRANSFER_TYPE
    ward_signed: bool = field(default=False, init=False)


class WormholeNTTAdapter(ChainAdapter):
    """
    Ward chain adapter for Wormhole Native Token Transfers (NTT).

    Enables cross-chain RLUSD resolution without wrapping or custodial bridges.
    The RLUSD issuer retains canonical control on every connected chain —
    no synthetic or wrapped representations are introduced.

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction payloads are returned unsigned for institution signing.

    Args:
        source_rpc_url: RPC endpoint for the origin chain (default: XRPL Altnet).
        dest_chain_id:  Wormhole chain ID of the destination chain.
        dest_rpc_url:   RPC endpoint for the destination chain.
        ntt_contract:   NTT manager contract address on the destination chain.
    """

    def __init__(
        self,
        source_rpc_url: str = "https://s.altnet.rippletest.net:51234/",
        dest_chain_id: int = 2,  # Wormhole chain ID 2 = Ethereum
        dest_rpc_url: str = "",
        ntt_contract: str = "",
    ) -> None:
        self._source_rpc_url = source_rpc_url
        self._dest_chain_id = dest_chain_id
        self._dest_rpc_url = dest_rpc_url
        self._ntt_contract = ntt_contract

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on the source chain.

        Reads default flag, outstanding loss, and pool balance directly
        from the source chain ledger. No off-chain data is trusted.

        Returns:
            VaultState with current on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        ledger_time = await self.get_ledger_time()

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
            outstanding_drops=outstanding,
            pool_usable_drops=pool_balance,
            ledger_time=ledger_time,
        )

    async def get_ledger_state(self) -> LedgerState:
        """
        Fetch a cross-chain state snapshot.

        Returns source chain time, destination chain block, current Guardian
        set index, RLUSD pool balance, and path availability.

        In production this queries both RPCs concurrently; this implementation
        provides the correct interface with safe defaults for testing.
        """
        source_time = await self.get_ledger_time()
        logger.info("get_ledger_state: source_chain_time=%d", source_time)
        return LedgerState(
            source_chain_time=source_time,
            dest_chain_block=0,
            guardian_set_index=0,
            rlusd_pool_balance=0,
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_drops: int,
        dest_chain_id: Optional[int] = None,
        nonce: int = 0,
    ) -> UnsignedTransaction:
        """
        Build an unsigned cross-chain RLUSD resolution transaction.

        Produces an UnsignedTransaction wrapping an NTT transfer payload.
        ward_signed is always False — the institution signs and submits;
        Wormhole Guardians attest; the destination chain settles.

        Args:
            pool_address:    Source pool account (XRPL or EVM address).
            claimant_address: Recipient on the destination chain.
            payout_drops:    Payout amount in source-chain smallest units.
            dest_chain_id:   Override destination chain (default: self._dest_chain_id).
            nonce:           NTT transfer nonce for deduplication.

        Returns:
            UnsignedTransaction with NTT payload in send_max; ward_signed=False.
        """
        effective_dest = (
            dest_chain_id if dest_chain_id is not None else self._dest_chain_id
        )

        ntt_payload = NTTTransferPayload(
            source_chain_id=_WORMHOLE_CHAIN_ID_XRPL,
            dest_chain_id=effective_dest,
            source_token=_RLUSD_XRPL_CURRENCY,
            dest_token=_RLUSD_XRPL_CURRENCY,
            sender=pool_address,
            recipient=claimant_address,
            amount=payout_drops,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d dest_chain=%d ward_signed=%s",
            pool_address[:8],
            claimant_address[:8],
            payout_drops,
            effective_dest,
            ntt_payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_NTT_TRANSFER_TYPE,
            account=pool_address,
            destination=claimant_address,
            amount_drops=payout_drops,
            send_max=_ntt_payload_to_dict(ntt_payload),
        )

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """
        Steps 1 + 8: Verify token exists and claimant currently holds it.

        Queries the source chain via the configured RPC URL.
        Returns None if the token is not found or has been burned.
        """
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:8],
            token_id[:16],
        )
        # Production: query source-chain AccountNFTs via source_rpc_url.
        # Returns None here — concrete subclasses override with live RPC.
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get current source-chain timestamp — never server clock."""
        # Production: call source_rpc_url for validated ledger close_time.
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Check if the XLS-66 default flag is set on-chain."""
        # Production: LedgerEntry(index=loan_id) → check LSF_LOAN_DEFAULT flag.
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get TotalValueOutstanding from the loan object."""
        # Production: LedgerEntry(index=loan_id) → TotalValueOutstanding.
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get usable pool balance minus XRPL reserve."""
        # Production: AccountInfo(account=pool_address) → Balance - reserve.
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """
        Settlement: Build unsigned escrow create transaction.

        ward_signed = False — returned dict is never signed by Ward.
        """
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "ward_signed": False,
        }

    async def build_unsigned_policy_mint(
        self,
        institution_address,
        vault_address,
        coverage_drops,
        period_days,
        pool_address,
        license_tier,
    ) -> dict:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: build_unsigned_policy_mint not implemented"
        )

    async def build_unsigned_premium_payment(
        self, institution_address, pool_address, premium_drops, nft_token_id
    ) -> dict:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: build_unsigned_premium_payment not implemented"
        )

    async def build_unsigned_nft_burn(self, claimant_address, nft_token_id) -> dict:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: build_unsigned_nft_burn not implemented"
        )

    async def verify_nft_not_burned(self, claimant_address, nft_token_id) -> bool:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: verify_nft_not_burned not implemented"
        )

    async def get_pool_health_ratio(self, pool_address) -> float:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: get_pool_health_ratio not implemented"
        )

    async def verify_kyc_credential(self, depositor_address) -> bool:
        """Stub — not yet implemented for this chain."""
        raise NotImplementedError(
            f"{self.__class__.__name__}: verify_kyc_credential not implemented"
        )

    async def build_unsigned_escrow_finish(
        self,
        claimant_address: str,
        owner_address: str,
        offer_sequence: int,
        condition_hex: str,
        fulfillment_hex: str,
    ) -> dict:
        """
        Settlement: Build unsigned escrow finish transaction.

        ward_signed = False — returned dict is never signed by Ward.
        """
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _ntt_payload_to_dict(payload: NTTTransferPayload) -> dict[str, Any]:
    """Serialise NTTTransferPayload to a plain dict for UnsignedTransaction.send_max."""
    return {
        "transfer_type": payload.transfer_type,
        "source_chain_id": payload.source_chain_id,
        "dest_chain_id": payload.dest_chain_id,
        "source_token": payload.source_token,
        "dest_token": payload.dest_token,
        "sender": payload.sender,
        "recipient": payload.recipient,
        "amount": payload.amount,
        "nonce": payload.nonce,
        "ward_signed": payload.ward_signed,
    }
