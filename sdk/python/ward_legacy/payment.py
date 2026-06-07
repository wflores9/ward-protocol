"""
Payment monitoring for premium collection.

Tracks Payment transactions to verify premium payments for policy issuance.
"""

import logging
from typing import Optional, Dict, Any, Callable, List
from datetime import datetime
from dataclasses import dataclass

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.models import Subscribe, Payment, Memo
from xrpl.utils import hex_to_str

from .database import WardDatabase


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PremiumPayment:
    """Verified premium payment."""
    tx_hash: str
    from_address: str
    to_address: str
    amount: int  # drops
    policy_request_id: Optional[str]
    timestamp: datetime
    ledger_index: int


class PaymentMonitor:
    """
    Monitor Payment transactions for premium collection.
    
    Watches for payments to pool premium account and matches
    them to pending policy requests via memo field.
    """
    
    def __init__(
        self,
        client: AsyncWebsocketClient,
        premium_account: str,
        database: WardDatabase
    ):
        """
        Initialize payment monitor.
        
        Args:
            client: XRPL WebSocket client
            premium_account: Address to watch for premium payments
            database: Database connection
        """
        self.client = client
        self.premium_account = premium_account
        self.db = database
        self.running = False
        self.payment_callbacks: List[Callable] = []
    
    def on_payment(self, callback: Callable):
        """
        Register callback for premium payments.
        
        Decorator usage:
            @monitor.on_payment
            async def handle_payment(payment: PremiumPayment):
                ...
        
        Args:
            callback: Async function taking PremiumPayment parameter
        """
        self.payment_callbacks.append(callback)
        return callback
    
    async def start(self):
        """Start monitoring premium payments."""
        logger.info(f"Starting payment monitor for account {self.premium_account}")
        
        if not self.client.is_open():
            await self.client.open()
        
        # Subscribe to transactions for premium account
        subscribe = Subscribe(
            accounts=[self.premium_account]
        )
        await self.client.send(subscribe)
        
        logger.info("Subscribed to premium account transactions")
        self.running = True
        
        # Process messages
        async for message in self.client:
            try:
                await self._handle_message(message)
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)
    
    async def stop(self):
        """Stop monitoring."""
        logger.info("Stopping payment monitor")
        self.running = False
        if self.client.is_open():
            await self.client.close()
    
    async def _handle_message(self, message: dict):
        """Process incoming WebSocket message."""
        if not isinstance(message, dict):
            return
        
        msg_type = message.get('type')
        
        if msg_type == 'transaction':
            await self._handle_transaction(message)
    
    async def _handle_transaction(self, message: dict):
        """Process transaction message looking for premium payments."""
        tx = message.get('transaction', {})
        meta = message.get('meta', {})
        
        # Check if this is a Payment to our premium account
        if tx.get('TransactionType') != 'Payment':
            return
        
        destination = tx.get('Destination')
        if destination != self.premium_account:
            return
        
        # Check if payment was successful
        if meta.get('TransactionResult') != 'tesSUCCESS':
            logger.warning(f"Payment failed: {meta.get('TransactionResult')}")
            return
        
        # Extract payment details
        from_address = tx.get('Account')
        amount = int(tx.get('Amount', 0))
        tx_hash = tx.get('hash')
        ledger_index = message.get('ledger_index', 0)
        
        logger.info(
            f"Premium payment received: {amount / 1_000_000:.2f} XRP "
            f"from {from_address}"
        )
        
        # Extract policy request ID from memo (if present)
        policy_request_id = None
        memos = tx.get('Memos', [])
        
        for memo in memos:
            memo_data = memo.get('Memo', {})
            memo_type = memo_data.get('MemoType')
            
            if memo_type:
                memo_type_str = hex_to_str(memo_type)
                if memo_type_str == 'policy_request_id':
                    memo_data_hex = memo_data.get('MemoData')
                    if memo_data_hex:
                        policy_request_id = hex_to_str(memo_data_hex)
                        logger.info(f"Policy request ID: {policy_request_id}")
                        break
        
        # Create payment record
        payment = PremiumPayment(
            tx_hash=tx_hash,
            from_address=from_address,
            to_address=self.premium_account,
            amount=amount,
            policy_request_id=policy_request_id,
            timestamp=datetime.utcnow(),
            ledger_index=ledger_index
        )
        
        # Store in database
        await self._store_payment(payment)
        
        # Trigger callbacks
        await self._trigger_callbacks(payment)
    
    async def _store_payment(self, payment: PremiumPayment):
        """Store premium payment in database."""
        # TODO: Add premium_payments table to schema
        logger.info(f"Payment stored: {payment.tx_hash}")
    
    async def _trigger_callbacks(self, payment: PremiumPayment):
        """Trigger all registered payment callbacks."""
        for callback in self.payment_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(payment)
                else:
                    callback(payment)
            except Exception as e:
                logger.error(
                    f"Error in callback {callback.__name__}: {e}",
                    exc_info=True
                )
    
    async def verify_payment(
        self,
        tx_hash: str,
        expected_amount: int,
        from_address: str
    ) -> bool:
        """
        Verify a payment transaction.
        
        Args:
            tx_hash: Transaction hash to verify
            expected_amount: Expected premium amount in drops
            from_address: Expected sender address
        
        Returns:
            True if payment is valid
        """
        from xrpl.models import Tx
        
        # Query transaction
        tx_request = Tx(transaction=tx_hash)
        response = await self.client.request(tx_request)
        
        if not response.is_successful():
            logger.error(f"Failed to fetch transaction: {tx_hash}")
            return False
        
        tx = response.result
        
        # Verify payment details
        if tx.get('TransactionType') != 'Payment':
            logger.error("Transaction is not a Payment")
            return False
        
        if tx.get('Account') != from_address:
            logger.error(f"Payment from wrong address: {tx.get('Account')}")
            return False
        
        if tx.get('Destination') != self.premium_account:
            logger.error(f"Payment to wrong account: {tx.get('Destination')}")
            return False
        
        amount = int(tx.get('Amount', 0))
        if amount < expected_amount:
            logger.error(
                f"Payment amount insufficient: {amount} < {expected_amount}"
            )
            return False
        
        # Check if successful
        meta = response.result.get('meta', {})
        if meta.get('TransactionResult') != 'tesSUCCESS':
            logger.error(f"Payment failed: {meta.get('TransactionResult')}")
            return False
        
        logger.info(f"Payment verified: {tx_hash}")
        return True


import asyncio
