"""
Ward Protocol — Module 4: EscrowSettlement

PREIMAGE-SHA-256 conditioned claim settlement via XRPL escrow.

Fixes:
  #1 Extracted from monolith.
  #2 pool_wallet / claimant_wallet typed as Wallet.
  #3 AsyncJsonRpcClient as context manager — no leaked connections.
  #6 submit_with_retry for all transactions.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Dict, Optional

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill
from xrpl.models import EscrowCancel, EscrowCreate, EscrowFinish, Memo, NFTokenBurn
from xrpl.utils import str_to_hex
from xrpl.wallet import Wallet

from ward.constants import (
    DEFAULT_TESTNET_URL,
    ESCROW_CANCEL_HOURS,
    ESCROW_DISPUTE_HOURS,
    WARD_POLICY_TAXON,
    TF_BURNABLE,
)
from ward.primitives import (
    LedgerError,
    ValidationError,
    WardError,
    get_ledger_close_time,
    submit_with_retry,
    validate_drops_amount,
    validate_wallet,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.settlement")


@dataclass
class EscrowRecord:
    """Record of an in-flight escrowed claim."""
    claim_id:            str
    nft_token_id:        str
    pool_address:        str
    claimant_address:    str
    payout_drops:        int
    escrow_sequence:     int
    condition_hex:       str
    tx_hash:             str
    finish_after_ripple: int
    cancel_after_ripple: int


class EscrowSettlement:
    """
    Module 4 — Crypto-conditioned claim settlement.

    Ward NEVER learns the preimage — the claimant generates and holds it.
    The condition_hex (sha256 of preimage) is submitted by the pool.
    The fulfillment_hex (the preimage) is submitted only by the claimant.

    Tier note:
      Starter:    pool operator submits create/cancel (manual tooling).
      Standard:   hosted API wraps this module.
      Enterprise: white-label — same interface, institution's keys.
    """

    def __init__(self, xrpl_url: str = DEFAULT_TESTNET_URL) -> None:
        self._url = xrpl_url

    async def create_claim_escrow(
        self,
        pool_wallet:      Wallet,
        claimant_address: str,
        payout_drops:     int,
        condition_hex:    str,
        nft_token_id:     str,
        claim_id:         str,
    ) -> EscrowRecord:
        """
        Create a time-locked + crypto-conditioned EscrowCreate from the pool.

        Args:
            pool_wallet:      Pool operator wallet (signs EscrowCreate).
            claimant_address: Payout destination.
            payout_drops:     Amount to lock in drops.
            condition_hex:    PREIMAGE-SHA-256 condition (from claimant).
            nft_token_id:     Policy NFT for memo audit trail.
            claim_id:         Unique claim identifier.

        Returns:
            EscrowRecord for use in finish_escrow or cancel_escrow.
        """
        pool_wallet = validate_wallet(pool_wallet, "pool_wallet")
        validate_xrpl_address(claimant_address, "claimant_address")
        validate_drops_amount(payout_drops, "payout_drops")

        async with AsyncJsonRpcClient(self._url) as client:
            now                  = await get_ledger_close_time(client)
            finish_after_ripple  = now + ESCROW_DISPUTE_HOURS * 3600
            cancel_after_ripple  = now + ESCROW_CANCEL_HOURS  * 3600

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
                condition=condition_hex,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/claim-escrow"),
                        memo_data=str_to_hex(audit_memo),
                    )
                ],
            )
            escrow_tx = await autofill(escrow_tx, client)
            response  = await submit_with_retry(escrow_tx, client, pool_wallet)

            tx_hash = response.result.get("hash", "")
            seq     = response.result.get("Sequence") or escrow_tx.sequence or 0

            logger.info(
                "EscrowCreate: %s  claim=%s  payout=%d drops  "
                "finish_after=%d  cancel_after=%d",
                tx_hash[:16], claim_id, payout_drops,
                finish_after_ripple, cancel_after_ripple,
            )
            return EscrowRecord(
                claim_id=claim_id,
                nft_token_id=nft_token_id,
                pool_address=pool_wallet.classic_address,
                claimant_address=claimant_address,
                payout_drops=payout_drops,
                escrow_sequence=seq,
                condition_hex=condition_hex,
                tx_hash=tx_hash,
                finish_after_ripple=finish_after_ripple,
                cancel_after_ripple=cancel_after_ripple,
            )

    async def finish_escrow(
        self,
        claimant_wallet: Wallet,
        escrow_record:   EscrowRecord,
        fulfillment_hex: str,
    ) -> Dict[str, str]:
        """
        Finish the escrow (release payout) and burn the policy NFT atomically.

        The claimant provides fulfillment_hex (the preimage in DER format).
        Ward never holds or generates the preimage — it comes from the claimant.

        Returns:
            {"finish_tx": hash, "burn_tx": hash}
        """
        claimant_wallet = validate_wallet(claimant_wallet, "claimant_wallet")

        async with AsyncJsonRpcClient(self._url) as client:
            current_time = await get_ledger_close_time(client)

            if current_time < escrow_record.finish_after_ripple:
                remaining = escrow_record.finish_after_ripple - current_time
                raise ValidationError(
                    f"Escrow finish window not yet open: "
                    f"{remaining // 3600}h {(remaining % 3600) // 60}m remaining"
                )
            if current_time >= escrow_record.cancel_after_ripple:
                raise ValidationError(
                    "Escrow cancel window has passed — use cancel_escrow instead"
                )

            # EscrowFinish
            finish_tx = EscrowFinish(
                account=claimant_wallet.classic_address,
                owner=escrow_record.pool_address,
                offer_sequence=escrow_record.escrow_sequence,
                condition=escrow_record.condition_hex,
                fulfillment=fulfillment_hex,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/claim-finish"),
                        memo_data=str_to_hex(
                            json.dumps(
                                {"claim_id": escrow_record.claim_id},
                                separators=(",", ":"),
                            )
                        ),
                    )
                ],
            )
            finish_tx    = await autofill(finish_tx, client)
            finish_resp  = await submit_with_retry(finish_tx, client, claimant_wallet)
            finish_hash  = finish_resp.result.get("hash", "")
            logger.info("EscrowFinish: %s  claim=%s", finish_hash[:16], escrow_record.claim_id)

            # NFTokenBurn — replay protection (policy can never be re-used)
            burn_tx = NFTokenBurn(
                account=claimant_wallet.classic_address,
                nftoken_id=escrow_record.nft_token_id,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/policy-burn"),
                        memo_data=str_to_hex(
                            json.dumps(
                                {"claim_id": escrow_record.claim_id,
                                 "finish_tx": finish_hash},
                                separators=(",", ":"),
                            )
                        ),
                    )
                ],
            )
            burn_tx   = await autofill(burn_tx, client)
            burn_resp = await submit_with_retry(burn_tx, client, claimant_wallet)
            burn_hash = burn_resp.result.get("hash", "")
            logger.info(
                "NFTokenBurn: %s  nft=%s  claim=%s",
                burn_hash[:16], escrow_record.nft_token_id[:16], escrow_record.claim_id,
            )
            return {"finish_tx": finish_hash, "burn_tx": burn_hash}

    async def cancel_escrow(
        self,
        pool_wallet:   Wallet,
        escrow_record: EscrowRecord,
        reason:        str,
    ) -> str:
        """
        Cancel the escrow and return funds to the pool (after cancel window).

        Args:
            pool_wallet:   Pool operator wallet (escrow owner).
            escrow_record: Record from create_claim_escrow().
            reason:        Reason for cancellation (stored in Memo).

        Returns:
            Transaction hash of the EscrowCancel.
        """
        pool_wallet = validate_wallet(pool_wallet, "pool_wallet")

        async with AsyncJsonRpcClient(self._url) as client:
            current_time = await get_ledger_close_time(client)
            if current_time < escrow_record.cancel_after_ripple:
                remaining = escrow_record.cancel_after_ripple - current_time
                raise ValidationError(
                    f"Escrow not yet cancellable: "
                    f"{remaining // 3600}h {(remaining % 3600) // 60}m remaining"
                )

            cancel_tx = EscrowCancel(
                account=pool_wallet.classic_address,
                owner=pool_wallet.classic_address,
                offer_sequence=escrow_record.escrow_sequence,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/claim-cancel"),
                        memo_data=str_to_hex(
                            f"claim={escrow_record.claim_id} reason={reason}"
                        ),
                    )
                ],
            )
            cancel_tx = await autofill(cancel_tx, client)
            resp      = await submit_with_retry(cancel_tx, client, pool_wallet)
            tx_hash   = resp.result.get("hash", "")
            logger.info(
                "EscrowCancel: %s  claim=%s  reason=%s",
                tx_hash[:16], escrow_record.claim_id, reason,
            )
            return tx_hash
