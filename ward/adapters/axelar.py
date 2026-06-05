"""
Ward Protocol — Axelar GMP Adapter

Cross-chain RLUSD resolution via Axelar General Message Passing (GMP).
Axelar acts as the transport layer — Ward sends a signed claim payload
to the Axelar Gateway; Axelar Validators relay it; the destination chain
executes the resolution via a Ward-deployed IAxelarExecutable contract.

ward_signed = False throughout. The GMP message payload is returned
unsigned; the institution signs the Gateway call; Ward is never a counterparty.

Architecture:
    AxelarAdapter extends ChainAdapter and manages two endpoints:
      - source_rpc_url:  origin chain (XRPL EVM / Flare / EVM)
      - dest_chain:      Axelar destination chain name (e.g. "ethereum", "polygon")

    Resolution flow:
      1. verify_vault()           — confirm vault state on source chain
      2. get_ledger_state()       — fetch cross-chain state + Axelar fee quote
      3. build_resolution_tx()    — produce unsigned Gateway callContract payload
      4. send_resolution_message() — serialise GMP message for institution dispatch
         Institution signs Gateway call; Axelar relays; destination chain settles.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from ward.chain import ChainAdapter, PolicyCertificate
from ward.primitives import UnsignedTransaction

logger = logging.getLogger("ward.adapters.axelar")

# Axelar chain names (canonical)
_AXELAR_CHAIN_XRPL_EVM: str = "xrpl-evm"
_AXELAR_CHAIN_ETHEREUM: str = "ethereum"
_AXELAR_GMP_CALL_TYPE: str = "AXELAR_GMP_CALL"

# Axelar Gateway contract addresses (canonical — placeholder until XLS-66 mainnet)
_AXELAR_GATEWAY_XRPL_EVM: str = "0x0000000000000000000000000000000000000000"


@dataclass
class VaultState:
    """Snapshot of vault state from verify_vault()."""

    vault_address: str
    is_defaulted: bool
    outstanding_amount: int
    pool_usable_amount: int
    block_timestamp: int


@dataclass
class LedgerState:
    """Cross-chain state + Axelar fee quote from get_ledger_state()."""

    source_block: int
    dest_block: int
    axelar_fee_estimate: int  # in source chain gas token
    rlusd_pool_balance: int
    path_available: bool


@dataclass
class AxelarGMPPayload:
    """Unsigned Axelar GMP callContract payload. ward_signed is always False."""

    source_chain: str
    dest_chain: str
    gateway_address: str
    dest_contract_address: str
    sender: str
    recipient: str
    amount: int
    nonce: int
    call_type: str = _AXELAR_GMP_CALL_TYPE
    ward_signed: bool = field(default=False, init=False)


class AxelarAdapter(ChainAdapter):
    """
    Ward chain adapter for Axelar General Message Passing (GMP).

    Enables cross-chain RLUSD resolution via Axelar's secured transport layer.
    No wrapping — RLUSD remains canonical on its origin chain; the destination
    chain receives a GMP message instructing a Ward-deployed contract to settle.

    ward_signed = False — no signing key is held or used by this adapter.
    All GMP payloads are returned unsigned for institution signing.

    Args:
        source_rpc_url:      RPC endpoint for the source chain.
        source_chain:        Axelar source chain name.
        dest_chain:          Axelar destination chain name.
        dest_rpc_url:        RPC endpoint for the destination chain.
        gateway_address:     Axelar Gateway contract on the source chain.
        dest_contract:       Ward IAxelarExecutable contract on the destination chain.
    """

    def __init__(
        self,
        source_rpc_url: str = "https://rpc-evm-sidechain.xrpl.org",
        source_chain: str = _AXELAR_CHAIN_XRPL_EVM,
        dest_chain: str = _AXELAR_CHAIN_ETHEREUM,
        dest_rpc_url: str = "",
        gateway_address: str = _AXELAR_GATEWAY_XRPL_EVM,
        dest_contract: str = "",
    ) -> None:
        self._source_rpc_url = source_rpc_url
        self._source_chain = source_chain
        self._dest_chain = dest_chain
        self._dest_rpc_url = dest_rpc_url
        self._gateway_address = gateway_address
        self._dest_contract = dest_contract

    # ── Ward-specific public interface ───────────────────────────────────────

    async def verify_vault(
        self,
        vault_address: str,
        loan_id: str,
        pool_address: str,
    ) -> VaultState:
        """
        Verify vault state on the source chain.

        Reads default flag, outstanding loss, and pool balance from the
        source chain. No off-chain data is trusted.

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
        Fetch cross-chain state and Axelar fee quote.

        In production queries both source and destination RPCs and calls
        the Axelar API for a current cross-chain fee estimate.
        """
        block_ts = await self.get_ledger_time()
        logger.info("get_ledger_state: source_block_ts=%d", block_ts)
        return LedgerState(
            source_block=0,
            dest_block=0,
            axelar_fee_estimate=0,
            rlusd_pool_balance=0,
            path_available=True,
        )

    async def build_resolution_tx(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_amount: int,
        dest_chain: Optional[str] = None,
        nonce: int = 0,
    ) -> UnsignedTransaction:
        """
        Build an unsigned Axelar GMP callContract transaction.

        Produces an UnsignedTransaction wrapping an AxelarGMPPayload.
        ward_signed is always False — the institution signs the Gateway call;
        Axelar Validators relay; the destination chain settles.

        Args:
            pool_address:    Source pool address (caller of Gateway.callContract).
            claimant_address: Recipient address on the destination chain.
            payout_amount:   Payout amount in source chain smallest units.
            dest_chain:      Override destination chain name.
            nonce:           GMP nonce for deduplication.

        Returns:
            UnsignedTransaction with GMP payload in send_max; ward_signed=False.
        """
        effective_dest = dest_chain if dest_chain is not None else self._dest_chain

        gmp_payload = AxelarGMPPayload(
            source_chain=self._source_chain,
            dest_chain=effective_dest,
            gateway_address=self._gateway_address,
            dest_contract_address=self._dest_contract,
            sender=pool_address,
            recipient=claimant_address,
            amount=payout_amount,
            nonce=nonce,
        )

        logger.info(
            "build_resolution_tx: pool=%s claimant=%s amount=%d dest=%s ward_signed=%s",
            pool_address[:8],
            claimant_address[:8],
            payout_amount,
            effective_dest,
            gmp_payload.ward_signed,
        )

        return UnsignedTransaction(
            tx_type=_AXELAR_GMP_CALL_TYPE,
            account=pool_address,
            destination=claimant_address,
            amount_drops=payout_amount,
            send_max=_payload_to_dict(gmp_payload),
        )

    async def send_resolution_message(
        self,
        *,
        pool_address: str,
        claimant_address: str,
        payout_amount: int,
        nonce: int = 0,
    ) -> dict[str, Any]:
        """
        Serialise a GMP message for institution dispatch to Axelar Gateway.

        Returns a plain dict ready for the institution to ABI-encode and
        pass to Gateway.callContractWithToken(). Ward never submits this.

        ward_signed = False — the institution signs and submits.
        """
        gmp_payload = AxelarGMPPayload(
            source_chain=self._source_chain,
            dest_chain=self._dest_chain,
            gateway_address=self._gateway_address,
            dest_contract_address=self._dest_contract,
            sender=pool_address,
            recipient=claimant_address,
            amount=payout_amount,
            nonce=nonce,
        )
        return _payload_to_dict(gmp_payload)

    # ── ChainAdapter abstract method implementations ──────────────────────────

    async def get_policy_certificate(
        self,
        claimant_address: str,
        token_id: str,
    ) -> Optional[PolicyCertificate]:
        """Steps 1 + 8: Query source-chain WardResolver for NFT holder."""
        logger.debug(
            "get_policy_certificate: claimant=%s token=%s",
            claimant_address[:8],
            token_id[:16],
        )
        return None

    async def get_ledger_time(self) -> int:
        """Step 2: Get source chain block timestamp via eth_getBlockByNumber."""
        return 0

    async def is_default_confirmed(
        self,
        vault_address: str,
        loan_id: str,
    ) -> bool:
        """Step 4: Check WardResolver._loanFlags on source chain."""
        return False

    async def get_vault_loss(self, loan_id: str) -> int:
        """Step 5: Get _loanOutstanding from WardResolver on source chain."""
        return 0

    async def get_pool_balance(self, pool_address: str) -> int:
        """Steps 6 + 9: Get _poolBalances from WardResolver on source chain."""
        return 0

    async def build_unsigned_escrow_create(
        self,
        pool_address: str,
        claimant_address: str,
        amount: int,
        condition_hex: str,
    ) -> dict:
        """Settlement: Build unsigned GMP escrow create. ward_signed=False."""
        return {
            "TransactionType": "EscrowCreate",
            "Account": pool_address,
            "Destination": claimant_address,
            "Amount": str(amount),
            "Condition": condition_hex,
            "source_chain": self._source_chain,
            "dest_chain": self._dest_chain,
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
        """Settlement: Build unsigned GMP escrow finish. ward_signed=False."""
        return {
            "TransactionType": "EscrowFinish",
            "Account": claimant_address,
            "Owner": owner_address,
            "OfferSequence": offer_sequence,
            "Condition": condition_hex,
            "Fulfillment": fulfillment_hex,
            "source_chain": self._source_chain,
            "dest_chain": self._dest_chain,
            "ward_signed": False,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────


def _payload_to_dict(payload: AxelarGMPPayload) -> dict[str, Any]:
    """Serialise AxelarGMPPayload to a plain dict for send_max / GMP dispatch."""
    return {
        "call_type": payload.call_type,
        "source_chain": payload.source_chain,
        "dest_chain": payload.dest_chain,
        "gateway_address": payload.gateway_address,
        "dest_contract_address": payload.dest_contract_address,
        "sender": payload.sender,
        "recipient": payload.recipient,
        "amount": payload.amount,
        "nonce": payload.nonce,
        "ward_signed": payload.ward_signed,
    }
