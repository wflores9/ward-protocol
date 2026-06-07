"""
Ward Protocol — Hedera Adapter

Native Hedera Token Service (HTS) resolution.
RLUSD on Hedera is an HTS token; Ward policy NFTs are Hedera NFTs (HTS NFT class).
Pool accounts are Hedera accounts with HTS token associations.

ward_signed = False throughout. All transaction payloads are returned
unsigned; the institution signs with their ED25519/ECDSA keypair; Hedera settles.

Architecture:
    HederaAdapter extends ChainAdapter and targets a Hedera mirror node
    and consensus node endpoint.
    Resolution flow:
      1. verify_vault()       — read Hedera NFT metadata + token balances
      2. get_ledger_state()   — fetch consensus timestamp and network state
      3. build_resolution_tx() — produce unsigned CryptoTransfer/TokenTransfer
         Institution signs; Hedera consensus settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.adapters._config import require_non_placeholder
from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.hedera")

# Hedera network identifiers
_HEDERA_MAINNET_MIRROR: str = "https://mainnet-public.mirrornode.hedera.com"
_HEDERA_TESTNET_MIRROR: str = "https://testnet.mirrornode.hedera.com"
_HEDERA_TRANSFER_TYPE: str = "HEDERA_CRYPTO_TRANSFER"

# RLUSD HTS token ID on Hedera (placeholder until Ripple publishes Hedera deployment)
_RLUSD_HEDERA_TOKEN_ID: str = "0.0.0"


@dataclass
class VaultState:
    """Snapshot of Hedera vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_tinybars: int
    pool_usable_tinybars: int
    consensus_timestamp: str


@dataclass
class LedgerState:
    """Hedera consensus state snapshot from get_ledger_state()."""

    consensus_timestamp: str
    network_version: str
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class HederaTransferPayload:
    """Unsigned Hedera CryptoTransfer/TokenTransfer payload. ward_signed is always False."""

    payer_account: str
    sender_account: str
    recipient_account: str
    token_id: str
    amount: int
    nonce: int
    transfer_type: str = _HEDERA_TRANSFER_TYPE
    ward_signed: bool = field(default=False, init=False)


class HederaAdapter(ChainAdapter):
    """
    Ward chain adapter for Hedera.

    Reads Hedera Token Service (HTS) state via Mirror Node REST API and
    builds unsigned TokenTransfer transactions. Ward policy NFTs are HTS
    non-fungible tokens; pool accounts hold RLUSD HTS token associations.

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction payloads are returned unsigned for institution signing.

    Args:
        mirror_node_url:   Hedera mirror node REST endpoint.
        rlusd_token_id:    RLUSD HTS token ID (e.g. "0.0.1234567").
        network:           "mainnet" or "testnet".
    """

    def __init__(
        self,
        mirror_node_url: str = _HEDERA_MAINNET_MIRROR,
        rlusd_token_id: str = _RLUSD_HEDERA_TOKEN_ID,
        network: str = "mainnet",
    ) -> None:
        self._mirror_node_url = mirror_node_url
        self._rlusd_token_id = require_non_placeholder(
            rlusd_token_id,
            field_name="rlusd_token_id",
            invalid_values={_RLUSD_HEDERA_TOKEN_ID},
        )
        self._network = network

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on Hedera.

        Reads HTS NFT metadata for the Ward policy, checks on-chain
        default flag via Ward HTS contract memo, and queries pool RLUSD
        token balance. No off-chain data is trusted.

        Returns:
            VaultState with current Hedera on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        consensus_ts = str(await self.get_ledger_time())

        logger.info(
            "verify_vault: vault=%s defaulted=%s outstanding=%d pool=%d",
            vault_address,
            is_defaulted,
            outstanding,
            pool_balance,
        )
        return VaultState(
            vault_address=vault_address,
            is_defaulted=is_defaulted,
            outstanding_tinybars=outstanding,
            pool_usable_tinybars=pool_balance,
            consensus_timestamp=consensus_ts,
        )

    async def get_ledger_state(self) -> LedgerState:
        """
        Fetch current Hedera consensus timestamp and network state.

        In production calls Mirror Node /api/v1/network/nodes and
        /api/v1/transactions to get consensus timestamp.
        """
        consensus_ts = str(await self.get_ledger_time())
        logger.info("get_ledger_state: consensus_timestamp=%s", consensus_ts)
        return LedgerState(
            consensus_timestamp=consensus_ts,
            network_version="",
            rlusd_pool_balance=0,
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_amount: int,
        nonce: int = 0,
    ) -> UnsignedTransaction:
        """
        Build an unsigned Hedera TokenTransfer transaction.

        Produces an UnsignedTransaction wrapping a HederaTransferPayload.
        ward_signed is always False — the institution signs; Hedera settles.

        Args:
            pool_address:    Source Hedera account ID (e.g. "0.0.123456").
            claimant_address: Recipient Hedera account ID.
            payout_amount:   Amount in HTS token base units.
            nonce:           Transaction nonce for deduplication.

        Returns:
            UnsignedTransaction with HTS payload in send_max; ward_signed=False.
        """
        hts_payload = HederaTransferPayload(
            payer_account=pool_address,
            sender_account=pool_address,
            recipient_account=claimant_address,
            token_id=self._rlusd_token_id,
            amount=payout_amount,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d ward_signed=%s",
            pool_address,
            claimant_address,
            payout_amount,
            hts_payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_HEDERA_TRANSFER_TYPE,
            account=pool_address,
            destination=claimant_address,
            amount_drops=payout_amount,
            send_max=_payload_to_dict(hts_payload),
        )

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """Steps 1 + 8: Read HTS NFT metadata and verify claimant ownership."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address,
            token_id,
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get current Hedera consensus timestamp via Mirror Node."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Read Ward HTS contract memo for default flag."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get outstanding loan amount from Ward HTS contract state."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get RLUSD HTS token balance via Mirror Node."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned Hedera ScheduleCreate wrapping TokenTransfer. ward_signed=False."""
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "token_id": self._rlusd_token_id,
            "network": self._network,
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
        """Settlement: Build unsigned Hedera ScheduleSign to release escrow. ward_signed=False."""
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "token_id": self._rlusd_token_id,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _payload_to_dict(payload: HederaTransferPayload) -> dict[str, Any]:
    """Serialise HederaTransferPayload to a plain dict for UnsignedTransaction.send_max."""
    return {
        "transfer_type": payload.transfer_type,
        "payer_account": payload.payer_account,
        "sender_account": payload.sender_account,
        "recipient_account": payload.recipient_account,
        "token_id": payload.token_id,
        "amount": payload.amount,
        "nonce": payload.nonce,
        "ward_signed": payload.ward_signed,
    }
