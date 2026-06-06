"""
Escrow settlement for insurance claims.

Implements 48-hour dispute window before claim payouts using XRPL Escrow.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass

from xrpl.models import (
    EscrowCreate, EscrowFinish, EscrowCancel,
    AccountObjects, Memo
)
from xrpl.wallet import Wallet
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.utils import str_to_hex, ripple_time_to_datetime, datetime_to_ripple_time

from .database import WardDatabase


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EscrowStatus:
    """Status of an escrowed claim."""
    claim_id: str
    escrow_sequence: int
    amount: int  # drops
    destination: str
    finish_after: datetime
    cancel_after: datetime
    status: str  # pending, finishable, finished, cancelled
    can_finish: bool
    can_cancel: bool


class ClaimEscrow:
    """
    Manages escrowed insurance claim payouts.
    
    Creates time-locked escrows with 48-hour dispute windows,
    allowing community review before claim settlement.
    """
    
    DISPUTE_WINDOW_HOURS = 48
    CANCEL_BUFFER_HOURS = 72  # Extra time before auto-cancel
    
    def __init__(
        self,
        client: AsyncWebsocketClient,
        wallet: Wallet,
        database: WardDatabase
    ):
        """
        Initialize escrow manager.
        
        Args:
            client: XRPL client
            wallet: Pool wallet (escrow source)
            database: Database connection
        """
        self.client = client
        self.wallet = wallet
        self.db = database
    
    async def create_claim_escrow(
        self,
        claim_id: str,
        payout_amount: int,
        destination: str
    ) -> Dict[str, Any]:
        """
        Create escrowed claim payout with 48-hour dispute window.
        
        Args:
            claim_id: Claim UUID
            payout_amount: Payout in drops
            destination: Claim recipient address
        
        Returns:
            Dictionary with escrow details
        """
        logger.info(
            f"Creating claim escrow: {payout_amount / 1_000_000:.2f} XRP "
            f"to {destination} (48hr window)"
        )
        
        # Calculate times
        now = datetime.utcnow()
        finish_after = now + timedelta(hours=self.DISPUTE_WINDOW_HOURS)
        cancel_after = finish_after + timedelta(hours=self.CANCEL_BUFFER_HOURS)
        
        # Convert to Ripple time
        finish_after_ripple = datetime_to_ripple_time(finish_after)
        cancel_after_ripple = datetime_to_ripple_time(cancel_after)
        
        # Create EscrowCreate transaction
        escrow_tx = EscrowCreate(
            account=self.wallet.address,
            destination=destination,
            amount=str(payout_amount),
            finish_after=finish_after_ripple,
            cancel_after=cancel_after_ripple,
            memos=[
                Memo(
                    memo_type=str_to_hex("ward_claim_escrow"),
                    memo_data=str_to_hex(f"Claim ID: {claim_id}")
                )
            ]
        )
        
        response = await submit_and_wait(escrow_tx, self.client, self.wallet)
        
        if not response.is_successful():
            raise Exception(f"Escrow creation failed: {response.result}")
        
        tx_hash = response.result['hash']
        escrow_sequence = response.result['Sequence']
        
        # Update claim in database
        await self.db.update_claim_status(
            claim_id=claim_id,
            status='escrowed',
            escrow_tx_hash=tx_hash
        )
        
        # Store escrow sequence
        await self._store_escrow_sequence(claim_id, escrow_sequence)
        
        logger.info(
            f"Escrow created: {tx_hash} (seq: {escrow_sequence}). "
            f"Finishable after: {finish_after.isoformat()}"
        )
        
        return {
            'claim_id': claim_id,
            'escrow_tx_hash': tx_hash,
            'escrow_sequence': escrow_sequence,
            'amount': payout_amount,
            'destination': destination,
            'finish_after': finish_after,
            'cancel_after': cancel_after,
            'status': 'escrowed'
        }
    
    async def finish_escrow(
        self,
        claim_id: str,
        escrow_sequence: int
    ) -> str:
        """
        Finish escrow and release claim payout.
        
        Args:
            claim_id: Claim UUID
            escrow_sequence: Escrow sequence number
        
        Returns:
            Transaction hash
        """
        logger.info(f"Finishing escrow for claim {claim_id} (seq: {escrow_sequence})")
        
        # Verify escrow is finishable
        status = await self.get_escrow_status(escrow_sequence)
        
        if not status.can_finish:
            raise ValueError(
                f"Escrow not finishable yet. Available after: {status.finish_after}"
            )
        
        # Create EscrowFinish transaction
        finish_tx = EscrowFinish(
            account=self.wallet.address,
            owner=self.wallet.address,
            offer_sequence=escrow_sequence
        )
        
        response = await submit_and_wait(finish_tx, self.client, self.wallet)
        
        if not response.is_successful():
            raise Exception(f"Escrow finish failed: {response.result}")
        
        tx_hash = response.result['hash']
        
        # Update claim status
        await self.db.update_claim_status(
            claim_id=claim_id,
            status='settled',
            settlement_tx_hash=tx_hash
        )
        
        logger.info(f"Escrow finished: {tx_hash}. Claim settled.")
        
        return tx_hash
    
    async def cancel_escrow(
        self,
        claim_id: str,
        escrow_sequence: int,
        reason: str
    ) -> str:
        """
        Cancel escrow (for disputed/fraudulent claims).
        
        Args:
            claim_id: Claim UUID
            escrow_sequence: Escrow sequence number
            reason: Cancellation reason
        
        Returns:
            Transaction hash
        """
        logger.info(
            f"Cancelling escrow for claim {claim_id} (seq: {escrow_sequence}). "
            f"Reason: {reason}"
        )
        
        # Verify escrow is cancellable
        status = await self.get_escrow_status(escrow_sequence)
        
        if not status.can_cancel:
            raise ValueError(
                f"Escrow not cancellable yet. Available after: {status.cancel_after}"
            )
        
        # Create EscrowCancel transaction
        cancel_tx = EscrowCancel(
            account=self.wallet.address,
            owner=self.wallet.address,
            offer_sequence=escrow_sequence
        )
        
        response = await submit_and_wait(cancel_tx, self.client, self.wallet)
        
        if not response.is_successful():
            raise Exception(f"Escrow cancel failed: {response.result}")
        
        tx_hash = response.result['hash']
        
        # Update claim status
        await self.db.update_claim_status(
            claim_id=claim_id,
            status='rejected',
            rejection_reason=f"Escrow cancelled: {reason}"
        )
        
        logger.info(f"Escrow cancelled: {tx_hash}")
        
        return tx_hash
    
    async def get_escrow_status(
        self,
        escrow_sequence: int
    ) -> EscrowStatus:
        """
        Get current status of an escrow.
        
        Args:
            escrow_sequence: Escrow sequence number
        
        Returns:
            EscrowStatus with current state
        """
        # Query escrow from ledger
        account_objects = AccountObjects(
            account=self.wallet.address,
            type="escrow"
        )
        
        response = await self.client.request(account_objects)
        
        if not response.is_successful():
            raise Exception(f"Failed to query escrows: {response.result}")
        
        # Find our escrow
        escrow_obj = None
        for obj in response.result.get('account_objects', []):
            if obj.get('Sequence') == escrow_sequence:
                escrow_obj = obj
                break
        
        if not escrow_obj:
            # Escrow not found - either finished or cancelled
            return EscrowStatus(
                claim_id="unknown",
                escrow_sequence=escrow_sequence,
                amount=0,
                destination="unknown",
                finish_after=datetime.utcnow(),
                cancel_after=datetime.utcnow(),
                status="finished_or_cancelled",
                can_finish=False,
                can_cancel=False
            )
        
        # Parse escrow details
        amount = int(escrow_obj['Amount'])
        destination = escrow_obj['Destination']
        finish_after = ripple_time_to_datetime(escrow_obj['FinishAfter'])
        cancel_after = ripple_time_to_datetime(escrow_obj['CancelAfter'])
        
        now = datetime.utcnow()
        can_finish = now >= finish_after
        can_cancel = now >= cancel_after
        
        if can_finish and not can_cancel:
            status = "finishable"
        elif can_cancel:
            status = "cancellable"
        else:
            status = "pending"
        
        return EscrowStatus(
            claim_id="unknown",  # Would need to look up from database
            escrow_sequence=escrow_sequence,
            amount=amount,
            destination=destination,
            finish_after=finish_after,
            cancel_after=cancel_after,
            status=status,
            can_finish=can_finish,
            can_cancel=can_cancel
        )
    
    async def get_pending_escrows(self) -> List[EscrowStatus]:
        """
        Get all pending escrows for this wallet.
        
        Returns:
            List of EscrowStatus objects
        """
        account_objects = AccountObjects(
            account=self.wallet.address,
            type="escrow"
        )
        
        response = await self.client.request(account_objects)
        
        if not response.is_successful():
            raise Exception(f"Failed to query escrows: {response.result}")
        
        escrows = []
        for obj in response.result.get('account_objects', []):
            sequence = obj.get('Sequence')
            if sequence:
                status = await self.get_escrow_status(sequence)
                escrows.append(status)
        
        return escrows
    
    async def _store_escrow_sequence(
        self,
        claim_id: str,
        escrow_sequence: int
    ):
        """Store escrow sequence number in claims table."""
        async with self.db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE claims
                SET escrow_sequence = $1
                WHERE claim_id = $2
                """,
                escrow_sequence, claim_id
            )
