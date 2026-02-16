"""
XLS-66 Default Event Monitor.

Real-time monitoring of XLS-66 loans, detecting defaults and calculating
vault depositor losses.
"""

import asyncio
import logging
from typing import Callable, Optional, Dict, List
from datetime import datetime

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.models import Subscribe, LedgerEntry, Tx

from .models import Loan, LoanBroker, Vault
from .utils.calculations import calculate_vault_loss, calculate_share_value_impact


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DefaultEvent:
    """Represents a detected XLS-66 loan default event."""
    
    def __init__(
        self,
        loan: Loan,
        loan_broker: LoanBroker,
        vault: Vault,
        default_amount: int,
        default_covered: int,
        vault_loss: int,
        tx_hash: str,
        ledger_index: int
    ):
        self.loan = loan
        self.loan_broker = loan_broker
        self.vault = vault
        self.default_amount = default_amount
        self.default_covered = default_covered
        self.vault_loss = vault_loss
        self.tx_hash = tx_hash
        self.ledger_index = ledger_index
        self.detected_at = datetime.utcnow()
    
    def __repr__(self):
        return (
            f"DefaultEvent(loan={self.loan.loan_id[:8]}..., "
            f"vault_loss={self.vault_loss / 1_000_000:.2f} XRP, "
            f"tx={self.tx_hash[:8]}...)"
        )


class XLS66Monitor:
    """
    Monitor XLS-66 lending protocol for default events.
    
    Subscribes to XRPL ledger stream and detects LoanManage transactions
    with tfLoanDefault flag. Calculates vault losses and triggers callbacks.
    
    Example:
        monitor = XLS66Monitor("wss://xrplcluster.com")
        
        @monitor.on_default
        async def handle_default(event: DefaultEvent):
            print(f"Default detected: {event.vault_loss} drops lost")
        
        await monitor.start()
    """
    
    def __init__(
        self,
        websocket_url: str = "wss://xrplcluster.com",
        monitored_loan_brokers: Optional[List[str]] = None
    ):
        """
        Initialize XLS-66 monitor.
        
        Args:
            websocket_url: XRPL WebSocket endpoint
            monitored_loan_brokers: List of LoanBroker IDs to monitor
                                   (None = monitor all)
        """
        self.websocket_url = websocket_url
        self.monitored_loan_brokers = set(monitored_loan_brokers or [])
        self.client: Optional[AsyncWebsocketClient] = None
        self.running = False
        self.default_callbacks: List[Callable] = []
        
        # Cache for ledger state
        self._loan_broker_cache: Dict[str, LoanBroker] = {}
        self._vault_cache: Dict[str, Vault] = {}
    
    def on_default(self, callback: Callable):
        """
        Register callback for default events.
        
        Decorator usage:
            @monitor.on_default
            async def handle(event: DefaultEvent):
                ...
        
        Args:
            callback: Async function taking DefaultEvent parameter
        """
        self.default_callbacks.append(callback)
        return callback
    
    async def start(self):
        """Start monitoring XLS-66 events."""
        logger.info(f"Starting XLS-66 monitor on {self.websocket_url}")
        
        self.client = AsyncWebsocketClient(self.websocket_url)
        await self.client.open()
        
        # Subscribe to ledger stream
        subscribe_request = Subscribe(streams=["ledger", "transactions"])
        await self.client.send(subscribe_request)
        
        logger.info("Subscribed to ledger stream")
        self.running = True
        
        # Process messages
        async for message in self.client:
            try:
                await self._handle_message(message)
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)
    
    async def stop(self):
        """Stop monitoring."""
        logger.info("Stopping XLS-66 monitor")
        self.running = False
        if self.client and self.client.is_open():
            await self.client.close()
    
    async def _handle_message(self, message: dict):
        """Process incoming WebSocket message."""
        if not isinstance(message, dict):
            return
        
        msg_type = message.get('type')
        
        if msg_type == 'transaction':
            await self._handle_transaction(message)
    
    async def _handle_transaction(self, message: dict):
        """Process transaction message looking for LoanManage defaults."""
        tx = message.get('transaction', {})
        meta = message.get('meta', {})
        
        # Check if this is a LoanManage transaction
        if tx.get('TransactionType') != 'LoanManage':
            return
        
        # Check for default flag (0x00010000 = tfLoanDefault)
        TF_LOAN_DEFAULT = 0x00010000
        flags = tx.get('Flags', 0)
        
        if not (flags & TF_LOAN_DEFAULT):
            return
        
        # This is a default event!
        loan_id = tx.get('LoanID')
        tx_hash = tx.get('hash')
        ledger_index = message.get('ledger_index', 0)
        
        logger.info(f"Default detected: Loan {loan_id[:8]}... in tx {tx_hash[:8]}...")
        
        try:
            # Fetch loan, broker, and vault state
            loan = await self._get_loan(loan_id)
            loan_broker = await self._get_loan_broker(loan.loan_broker_id)
            vault = await self._get_vault(loan_broker.vault_id)
            
            # Check if we're monitoring this broker
            if self.monitored_loan_brokers and loan_broker.loan_broker_id not in self.monitored_loan_brokers:
                logger.debug(f"Skipping unmonitored LoanBroker {loan_broker.loan_broker_id[:8]}...")
                return
            
            # Calculate loss amounts
            loss_calc = calculate_vault_loss(
                principal_outstanding=loan.principal_outstanding,
                interest_outstanding=loan.interest_outstanding,
                debt_total=loan_broker.debt_total,
                cover_available=loan_broker.cover_available,
                cover_rate_minimum=loan_broker.cover_rate_minimum,
                cover_rate_liquidation=loan_broker.cover_rate_liquidation
            )
            
            # Create default event
            event = DefaultEvent(
                loan=loan,
                loan_broker=loan_broker,
                vault=vault,
                default_amount=loss_calc['default_amount'],
                default_covered=loss_calc['default_covered'],
                vault_loss=loss_calc['vault_loss'],
                tx_hash=tx_hash,
                ledger_index=ledger_index
            )
            
            # Log event details
            logger.info(
                f"Default details: "
                f"Amount={event.default_amount / 1_000_000:.2f} XRP, "
                f"Covered={event.default_covered / 1_000_000:.2f} XRP, "
                f"VaultLoss={event.vault_loss / 1_000_000:.2f} XRP"
            )
            
            # Calculate share value impact
            share_impact = calculate_share_value_impact(
                assets_total_before=vault.assets_total,
                loss_unrealized=vault.loss_unrealized,
                shares_total=vault.shares_total,
                vault_loss=event.vault_loss
            )
            
            logger.info(
                f"Share impact: "
                f"{share_impact['share_value_before']:.6f} XRP → "
                f"{share_impact['share_value_after']:.6f} XRP "
                f"({share_impact['loss_percentage']:.2f}% loss)"
            )
            
            # Trigger callbacks
            await self._trigger_callbacks(event)
            
        except Exception as e:
            logger.error(f"Error processing default event: {e}", exc_info=True)
    
    async def _trigger_callbacks(self, event: DefaultEvent):
        """Trigger all registered default callbacks."""
        for callback in self.default_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"Error in callback {callback.__name__}: {e}", exc_info=True)
    
    async def _get_loan(self, loan_id: str) -> Loan:
        """Fetch Loan ledger entry."""
        request = LedgerEntry(loan=loan_id)
        response = await self.client.request(request)
        
        if not response.is_successful():
            raise ValueError(f"Failed to fetch Loan {loan_id}: {response.result}")
        
        return Loan.from_ledger_entry(response.result)
    
    async def _get_loan_broker(self, loan_broker_id: str) -> LoanBroker:
        """Fetch LoanBroker ledger entry (with caching)."""
        if loan_broker_id in self._loan_broker_cache:
            return self._loan_broker_cache[loan_broker_id]
        
        request = LedgerEntry(loan_broker=loan_broker_id)
        response = await self.client.request(request)
        
        if not response.is_successful():
            raise ValueError(f"Failed to fetch LoanBroker {loan_broker_id}: {response.result}")
        
        broker = LoanBroker.from_ledger_entry(response.result)
        self._loan_broker_cache[loan_broker_id] = broker
        return broker
    
    async def _get_vault(self, vault_id: str) -> Vault:
        """Fetch Vault ledger entry (with caching)."""
        if vault_id in self._vault_cache:
            return self._vault_cache[vault_id]
        
        request = LedgerEntry(vault=vault_id)
        response = await self.client.request(request)
        
        if not response.is_successful():
            raise ValueError(f"Failed to fetch Vault {vault_id}: {response.result}")
        
        vault = Vault.from_ledger_entry(response.result)
        self._vault_cache[vault_id] = vault
        return vault
    
    def add_loan_broker(self, loan_broker_id: str):
        """Add a LoanBroker to monitor list."""
        self.monitored_loan_brokers.add(loan_broker_id)
        logger.info(f"Now monitoring LoanBroker {loan_broker_id[:8]}...")
    
    def remove_loan_broker(self, loan_broker_id: str):
        """Remove a LoanBroker from monitor list."""
        self.monitored_loan_brokers.discard(loan_broker_id)
        logger.info(f"Stopped monitoring LoanBroker {loan_broker_id[:8]}...")
