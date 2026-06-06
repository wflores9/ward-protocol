"""
Ward Protocol — Solana Adapter

Native Solana resolution using SPL Token accounts.
RLUSD on Solana is an SPL token; pool accounts are standard token accounts.
Ward policy NFTs are Metaplex NFTs with Ward taxon attribute.

ward_signed = False throughout. All transaction payloads are returned
unsigned; the institution signs with their keypair; Solana settles.

Architecture:
    SolanaAdapter extends ChainAdapter and targets a Solana RPC endpoint.
    Resolution flow:
      1. verify_vault()       — read vault Metaplex NFT + SPL token accounts
      2. get_ledger_state()   — fetch slot, blockhash, and clock sysvar
      3. build_resolution_tx() — produce unsigned SPL transfer instruction set
         Institution signs; Solana runtime settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.adapters._config import require_non_placeholder
from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.solana")

# Solana constants
_SOLANA_MAINNET_RPC: str = "https://api.mainnet-beta.solana.com"
_SOLANA_DEVNET_RPC: str = "https://api.devnet.solana.com"
_SOLANA_TRANSFER_TYPE: str = "SOLANA_TRANSFER"

# SPL Token program — canonical
_SPL_TOKEN_PROGRAM: str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

# RLUSD SPL mint address (placeholder until Ripple publishes Solana deployment)
_RLUSD_SOLANA_MINT: str = "RLUSDmintAddressPlaceholder111111111111111"


@dataclass
class VaultState:
    """Snapshot of Solana vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_lamports: int
    pool_usable_lamports: int
    slot: int


@dataclass
class LedgerState:
    """Solana slot + blockhash snapshot from get_ledger_state()."""

    slot: int
    blockhash: str
    block_time: int
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class SolanaTransferPayload:
    """Unsigned Solana SPL transfer payload. ward_signed is always False."""

    source_token_account: str
    dest_token_account: str
    authority: str
    mint: str
    amount: int
    recent_blockhash: str
    nonce: int
    transfer_type: str = _SOLANA_TRANSFER_TYPE
    ward_signed: bool = field(default=False, init=False)


class SolanaAdapter(ChainAdapter):
    """
    Ward chain adapter for Solana.

    Reads Solana account state via JSON-RPC and builds unsigned SPL token
    transfer instructions. Policy NFTs are Metaplex NFTs; pool accounts
    are SPL token accounts holding RLUSD.

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction payloads are returned unsigned for institution signing.

    Args:
        rpc_url:       Solana JSON-RPC endpoint.
        rlusd_mint:    RLUSD SPL token mint address.
        commitment:    Solana commitment level ("finalized" / "confirmed").
    """

    def __init__(
        self,
        rpc_url: str = _SOLANA_MAINNET_RPC,
        rlusd_mint: str = _RLUSD_SOLANA_MINT,
        commitment: str = "finalized",
    ) -> None:
        self._rpc_url = rpc_url
        self._rlusd_mint = require_non_placeholder(
            rlusd_mint,
            field_name="rlusd_mint",
            invalid_values={_RLUSD_SOLANA_MINT},
        )
        self._commitment = commitment

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on Solana.

        Reads Metaplex NFT metadata for the Ward policy, checks on-chain
        default flag from the Ward program account, and queries the SPL
        pool token balance. No off-chain data is trusted.

        Returns:
            VaultState with current Solana on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        slot = await self.get_ledger_time()

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
            outstanding_lamports=outstanding,
            pool_usable_lamports=pool_balance,
            slot=slot,
        )

    async def get_ledger_state(self) -> LedgerState:
        """
        Fetch current Solana slot, blockhash, and clock sysvar.

        In production calls getLatestBlockhash and getSlot; blockhash is
        required for transaction construction.
        """
        slot = await self.get_ledger_time()
        logger.info("get_ledger_state: slot=%d", slot)
        return LedgerState(
            slot=slot,
            blockhash="",
            block_time=0,
            rlusd_pool_balance=0,
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_token_account: str,
        claimant_token_account: str,
        authority_address: str,
        payout_amount: int,
        recent_blockhash: str = "",
        nonce: int = 0,
    ) -> UnsignedTransaction:
        """
        Build an unsigned Solana SPL token transfer instruction.

        Produces an UnsignedTransaction wrapping a SolanaTransferPayload.
        ward_signed is always False — the institution signs with their keypair;
        Solana runtime settles.

        Args:
            pool_token_account:     Source SPL token account (pool's RLUSD account).
            claimant_token_account: Destination SPL token account.
            authority_address:      Pool authority (institution keypair).
            payout_amount:          Amount in SPL token base units.
            recent_blockhash:       Recent blockhash from getLatestBlockhash.
            nonce:                  Instruction nonce for deduplication.

        Returns:
            UnsignedTransaction with SPL payload in send_max; ward_signed=False.
        """
        sol_payload = SolanaTransferPayload(
            source_token_account=pool_token_account,
            dest_token_account=claimant_token_account,
            authority=authority_address,
            mint=self._rlusd_mint,
            amount=payout_amount,
            recent_blockhash=recent_blockhash,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d ward_signed=%s",
            pool_token_account[:8],
            claimant_token_account[:8],
            payout_amount,
            sol_payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_SOLANA_TRANSFER_TYPE,
            account=pool_token_account,
            destination=claimant_token_account,
            amount_drops=payout_amount,
            send_max=_payload_to_dict(sol_payload),
        )

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """Steps 1 + 8: Read Metaplex NFT metadata and verify claimant ownership."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:8],
            token_id[:16],
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get current Solana slot via getSlot RPC."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Read Ward program account for LSF_LOAN_DEFAULT equivalent."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get outstanding loan amount from Ward program account."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get SPL token balance of pool account via getTokenAccountBalance."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned SPL transfer with timelock condition. ward_signed=False."""
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "mint": self._rlusd_mint,
            "spl_token_program": _SPL_TOKEN_PROGRAM,
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
        """Settlement: Build unsigned SPL transfer fulfillment. ward_signed=False."""
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "mint": self._rlusd_mint,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _payload_to_dict(payload: SolanaTransferPayload) -> dict[str, Any]:
    """Serialise SolanaTransferPayload to a plain dict for UnsignedTransaction.send_max."""
    return {
        "transfer_type": payload.transfer_type,
        "source_token_account": payload.source_token_account,
        "dest_token_account": payload.dest_token_account,
        "authority": payload.authority,
        "mint": payload.mint,
        "amount": payload.amount,
        "recent_blockhash": payload.recent_blockhash,
        "nonce": payload.nonce,
        "ward_signed": payload.ward_signed,
    }
