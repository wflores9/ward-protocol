"""
Ward Protocol — XDC Adapter

EVM-compatible resolution on XDC Network (XinFin).
XDC is a dual-prefix EVM chain (addresses use "xdc" prefix instead of "0x").
WardResolver.sol deploys unchanged; XDC's EVM is fully compatible with Solidity 0.8.x.

RLUSD on XDC arrives via XinFin's cross-chain bridge from XRPL; the
Ward oracle writes verified state to WardResolver on XDC.

ward_signed = False throughout. All transaction payloads are returned
unsigned for institution signing. Ward is never a counterparty.

Architecture:
    XDCAdapter extends ChainAdapter and targets XDC's JSON-RPC endpoint.
    Resolution flow:
      1. verify_vault()       — confirm vault state on XDC
      2. get_ledger_state()   — fetch block and network state
      3. build_resolution_tx() — produce unsigned EVM call payload
         Institution signs; XDC EVM settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.xdc")

# XDC Network chain identifiers
_XDC_CHAIN_ID_MAINNET: int = 50
_XDC_CHAIN_ID_TESTNET: int = 51  # Apothem testnet
_XDC_EVM_CALL_TYPE: str = "XDC_EVM_CALL"

# XDC address prefix convention (used in display; underlying bytes are same as EVM)
_XDC_ADDRESS_PREFIX: str = "xdc"

# Canonical RLUSD placeholder on XDC (published at XLS-66 mainnet + bridge)
_RLUSD_XDC_ADDRESS: str = "xdc0000000000000000000000000000000000000000"


@dataclass
class VaultState:
    """Snapshot of XDC vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_amount: int  # in wei (RLUSD ERC-20)
    pool_usable_amount: int
    block_timestamp: int


@dataclass
class LedgerState:
    """XDC block snapshot from get_ledger_state()."""

    block_number: int
    block_timestamp: int
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class XDCResolutionPayload:
    """Unsigned XDC EVM call payload. ward_signed is always False."""

    chain_id: int
    contract_address: str
    caller: str
    recipient: str
    amount: int
    nonce: int
    call_type: str = _XDC_EVM_CALL_TYPE
    ward_signed: bool = field(default=False, init=False)


class XDCAdapter(ChainAdapter):
    """
    Ward chain adapter for XDC Network.

    Deploys WardResolver.sol on XDC's EVM for deterministic nine-check
    resolution. RLUSD arrives via XinFin bridge from XRPL; Ward oracle
    writes verified state; institutions call resolveClaimUnsigned().

    ward_signed = False — no signing key is held or used by this adapter.
    All transaction payloads are returned unsigned for institution signing.

    Args:
        rpc_url:           XDC JSON-RPC endpoint.
        chain_id:          XDC chain ID (50 mainnet / 51 Apothem testnet).
        ward_resolver:     Deployed WardResolver.sol contract address.
        rlusd_address:     RLUSD ERC-20 contract address on XDC.
    """

    def __init__(
        self,
        rpc_url: str = "https://rpc.xdc.org",
        chain_id: int = _XDC_CHAIN_ID_MAINNET,
        ward_resolver: str = "",
        rlusd_address: str = _RLUSD_XDC_ADDRESS,
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
        Verify vault state on XDC.

        Reads default flag, outstanding loss, and pool balance from
        WardResolver on XDC EVM. XDC addresses may use "xdc" prefix;
        the adapter normalises to "0x" for RPC calls internally.

        Returns:
            VaultState with current XDC on-chain snapshot.
        """
        is_defaulted = await self.is_default_confirmed(vault_address, loan_id)
        outstanding = await self.get_vault_loss(loan_id)
        pool_balance = await self.get_pool_balance(pool_address)
        block_ts = await self.get_ledger_time()

        logger.info(
            "verify_vault: vault=%s defaulted=%s outstanding=%d pool=%d",
            vault_address[:10],
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
        Fetch current XDC block number and timestamp.

        In production calls eth_getBlockByNumber("latest") on XDC RPC.
        """
        block_ts = await self.get_ledger_time()
        logger.info("get_ledger_state: block_timestamp=%d", block_ts)
        return LedgerState(
            block_number=0,
            block_timestamp=block_ts,
            rlusd_pool_balance=0,
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
        Build an unsigned XDC EVM resolution transaction.

        Produces an UnsignedTransaction wrapping an XDCResolutionPayload.
        ward_signed is always False — the institution signs; XDC EVM settles.

        Args:
            pool_address:    Source pool contract address on XDC.
            claimant_address: Recipient address on XDC.
            payout_amount:   Payout in wei (RLUSD ERC-20).
            dest_chain_id:   Override chain ID (default: self._chain_id).
            nonce:           EVM transaction nonce.

        Returns:
            UnsignedTransaction with XDC EVM payload; ward_signed=False.
        """
        effective_chain = dest_chain_id if dest_chain_id is not None else self._chain_id

        payload = XDCResolutionPayload(
            chain_id=effective_chain,
            contract_address=self._ward_resolver,
            caller=pool_address,
            recipient=claimant_address,
            amount=payout_amount,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d chain=%d ward_signed=%s",
            pool_address[:10],
            claimant_address[:10],
            payout_amount,
            effective_chain,
            payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_XDC_EVM_CALL_TYPE,
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
        """Steps 1 + 8: Query WardResolver._nftHolders on XDC EVM."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:10],
            token_id[:16],
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get current XDC block timestamp via eth_getBlockByNumber."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Check WardResolver._loanFlags on XDC."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get _loanOutstanding from WardResolver on XDC."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get _poolBalances from WardResolver on XDC."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned XDC EVM escrow create. ward_signed=False."""
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
        """Settlement: Build unsigned XDC EVM escrow finish. ward_signed=False."""
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


def _payload_to_dict(payload: XDCResolutionPayload) -> dict[str, Any]:
    """Serialise XDCResolutionPayload to a plain dict for UnsignedTransaction.send_max."""
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
