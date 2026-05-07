"""
Ward Protocol - Module 4: EscrowSettlement

PREIMAGE-SHA-256 conditioned claim settlement via XRPL escrow.

Fixes:
  #1 Extracted from monolith.
  #2 pool_wallet typed as Wallet.
  #3 AsyncJsonRpcClient as context manager - no leaked connections.
  #6 submit_with_retry for all transactions.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Dict

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill
from xrpl.models import EscrowCancel, EscrowCreate, EscrowFinish, Memo, NFTokenBurn
from xrpl.utils import str_to_hex
from xrpl.wallet import Wallet

from ward.constants import (
    DEFAULT_TESTNET_URL,
    ESCROW_CANCEL_HOURS,
    ESCROW_DISPUTE_HOURS,
)
from ward.primitives import (
    ValidationError,
    get_ledger_close_time,
    submit_with_retry,
    validate_drops_amount,
    validate_wallet,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.settlement")

_SECONDS_PER_HOUR = 3_600


@dataclass
class EscrowRecord:
    claim_id:             str
    nft_token_id:         str
    pool_address:         str
    claimant_address:     str
    payout_drops:         int
    escrow_sequence:      int
    condition_hex:        str
    tx_hash:              str
    finish_after_ripple:  int = 0
    cancel_after_ripple:  int = 0


class EscrowSettlement:
    """
    Manage XRPL escrow lifecycle for Ward Protocol insurance payouts.

    Module 4 - Crypto-conditioned claim settlement.

    Ward NEVER learns the preimage - the claimant generates and holds it.
    The condition_hex (sha256 of preimage) is submitted by the pool.
    The fulfillment_hex (the preimage) is submitted only by the claimant.

    Timing semantics:
      finish_after_ripple: pool MUST finish BEFORE this time (dispute window opens).
      cancel_after_ripple: pool can cancel AFTER this time if unclaimed.

    Tier note:
      Starter:    pool operator submits create/cancel (manual tooling).
      Standard:   hosted API wraps this module.
      Enterprise: white-label - same interface, institution keys.
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

        finish_after_ripple = current_time + ESCROW_DISPUTE_HOURS * 3600.
        Pool must finish() BEFORE that deadline (dispute window opens after).
        cancel_after_ripple = current_time + ESCROW_CANCEL_HOURS  * 3600.
        Pool can cancel() AFTER cancel_after_ripple if claimant never finished.
        """
        validate_xrpl_address(claimant_address, "claimant_address")
        validate_drops_amount(payout_drops, "payout_drops")
        pool_wallet = validate_wallet(pool_wallet, "pool_wallet")

        async with AsyncJsonRpcClient(self._url) as client:
            current_time = await get_ledger_close_time(client)
            finish_after_ripple = current_time + (ESCROW_DISPUTE_HOURS * _SECONDS_PER_HOUR)
            cancel_after_ripple = current_time + (ESCROW_CANCEL_HOURS  * _SECONDS_PER_HOUR)

            audit_memo = json.dumps(
                {"claim_id": claim_id, "nft": nft_token_id},
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
        pool_wallet:     Wallet,
        claimant_wallet: Wallet,
        escrow_record:   EscrowRecord,
        fulfillment_hex: str,
    ) -> Dict[str, str]:
        """
        Finish the escrow (release payout) before the dispute window opens.

        The pool submits EscrowFinish before finish_after_ripple; the claimant
        burns their own NFT afterward. Only the NFT holder can burn it —
        the pool cannot (tecNO_PERMISSION).

        Args:
            pool_wallet:     Pool operator wallet (submits EscrowFinish).
            claimant_wallet: Claimant wallet (burns their own policy NFT).
            escrow_record:   Record from create_claim_escrow.
            fulfillment_hex: Preimage fulfillment hex from the claimant.

        Returns:
            {"finish_tx": hash, "burn_tx": hash}
        """
        async with AsyncJsonRpcClient(self._url) as client:
            current_time = await get_ledger_close_time(client)

            if current_time >= escrow_record.finish_after_ripple:
                deadline = escrow_record.finish_after_ripple
                over = current_time - deadline
                raise ValidationError(
                    f"Escrow dispute window is open: "
                    f"deadline {deadline} passed {over}s ago "
                    f"(ledger time {current_time})"
                )

            pool_wallet     = validate_wallet(pool_wallet,     "pool_wallet")
            claimant_wallet = validate_wallet(claimant_wallet, "claimant_wallet")

            finish_tx = EscrowFinish(
                account=pool_wallet.classic_address,
                owner=escrow_record.pool_address,
                offer_sequence=escrow_record.escrow_sequence,
                condition=escrow_record.condition_hex,
                fulfillment=fulfillment_hex,
            )
            finish_tx   = await autofill(finish_tx, client)
            finish_resp = await submit_with_retry(finish_tx, client, pool_wallet)
            finish_hash = finish_resp.result.get("hash", "")
            logger.info(
                "EscrowFinish: %s  claim=%s",
                finish_hash[:16], escrow_record.claim_id,
            )

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
                "NFTokenBurn: %s  claim=%s",
                burn_hash[:16], escrow_record.claim_id,
            )

        return {
            "finish_tx": finish_hash,
            "burn_tx":   burn_hash,
        }

    async def cancel_escrow(
        self,
        pool_wallet:   Wallet,
        escrow_record: EscrowRecord,
        reason:        str,
    ) -> str:
        """
        Cancel the escrow and return funds to the pool (after cancel window).

        The pool can cancel AFTER cancel_after_ripple if the claimant
        never finished the escrow.
        """
        async with AsyncJsonRpcClient(self._url) as client:
            current_time = await get_ledger_close_time(client)
            if current_time < escrow_record.cancel_after_ripple:
                remaining = escrow_record.cancel_after_ripple - current_time
                raise ValidationError(
                    f"Escrow not yet cancellable: "
                    f"{remaining // 3600}h {(remaining % 3600) // 60}m remaining "
                    f"(ledger time {current_time} < "
                    f"cancel_after {escrow_record.cancel_after_ripple})"
                )

            pool_wallet = validate_wallet(pool_wallet, "pool_wallet")

            cancel_tx = EscrowCancel(
                account=pool_wallet.classic_address,
                owner=escrow_record.pool_address,
                offer_sequence=escrow_record.escrow_sequence,
                memos=[
                    Memo(
                        memo_type=str_to_hex("ward/escrow-cancel"),
                        memo_data=str_to_hex(reason[:200]),
                    )
                ],
            )
            cancel_tx = await autofill(cancel_tx, client)
            result    = await submit_with_retry(cancel_tx, client, pool_wallet)
            tx_hash   = result.result.get("hash", "")

        logger.info(
            "EscrowCancel: %s  claim=%s  reason=%s",
            tx_hash[:16], escrow_record.claim_id, reason,
        )
        return tx_hash
