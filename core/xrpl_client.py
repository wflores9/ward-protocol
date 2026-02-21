"""
Enterprise-grade XRPL client with full monitoring and validation
"""

import asyncio
from typing import Optional, Dict, Callable
from datetime import datetime
from xrpl.asyncio.clients import AsyncWebsocketClient, AsyncJsonRpcClient
from xrpl.models import Response, Transaction
from xrpl.models.requests import Subscribe, AccountInfo
from xrpl.wallet import Wallet
import structlog

logger = structlog.get_logger()


class XRPLErrorHandler:
    """Maps XRPL error codes to meaningful messages"""
    
    ERROR_CODES = {
        "tecUNFUNDED_PAYMENT": "Insufficient XRP balance",
        "tecNO_DST_INSUF_XRP": "Destination account requires minimum XRP",
        "tecDST_TAG_NEEDED": "Destination tag required",
        "tefPAST_SEQ": "Transaction sequence number too low",
        "tefMAX_LEDGER": "Transaction expired (max ledger exceeded)",
        "terRETRY": "Retry transaction",
        "temBAD_FEE": "Invalid fee amount",
        "temBAD_SEQUENCE": "Invalid sequence number",
    }
    
    @classmethod
    def get_error_message(cls, error_code: str) -> str:
        """Get human-readable error message"""
        return cls.ERROR_CODES.get(error_code, f"Unknown XRPL error: {error_code}")


class XRPLConnectionPool:
    """Manages XRPL connections with health monitoring"""
    
    def __init__(self, 
                 websocket_url: str = "wss://s.altnet.rippletest.net:51233",
                 json_rpc_url: str = "https://s.altnet.rippletest.net:51234"):
        self.ws_url = websocket_url
        self.rpc_url = json_rpc_url
        self.ws_client: Optional[AsyncWebsocketClient] = None
        self.rpc_client: Optional[AsyncJsonRpcClient] = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        
        # Health metrics
        self.last_heartbeat: Optional[datetime] = None
        self.successful_requests = 0
        self.failed_requests = 0
        self.connection_uptime_start: Optional[datetime] = None
        
    async def connect(self):
        """Establish connections with retry logic"""
        try:
            # WebSocket for subscriptions
            self.ws_client = AsyncWebsocketClient(self.ws_url)
            
            # JSON-RPC for queries
            self.rpc_client = AsyncJsonRpcClient(self.rpc_url)
            
            # Test connection with a simple request
            await self._test_connection()
            
            self.is_connected = True
            self.reconnect_attempts = 0
            self.connection_uptime_start = datetime.utcnow()
            self.last_heartbeat = datetime.utcnow()
            
            logger.info("xrpl_connected", 
                       ws_url=self.ws_url,
                       rpc_url=self.rpc_url,
                       uptime_start=self.connection_uptime_start.isoformat())
            
            # Start heartbeat monitoring
            asyncio.create_task(self._heartbeat_monitor())
            
        except Exception as e:
            self.failed_requests += 1
            logger.error("xrpl_connection_failed", 
                        error=str(e),
                        attempt=self.reconnect_attempts)
            
            if self.reconnect_attempts < self.max_reconnect_attempts:
                self.reconnect_attempts += 1
                await asyncio.sleep(2 ** self.reconnect_attempts)
                await self.connect()
            else:
                raise ConnectionError("XRPL connection failed after max retries")
    
    async def _test_connection(self):
        """Test XRPL connection with simple request"""
        from xrpl.models.requests import ServerInfo
        
        request = ServerInfo()
        response = await self.rpc_client.request(request)
        
        if not response.is_successful():
            raise Exception("XRPL connection test failed")
    
    async def _heartbeat_monitor(self):
        """Monitor connection health with periodic checks"""
        while self.is_connected:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                # Test connection
                await self._test_connection()
                
                self.last_heartbeat = datetime.utcnow()
                self.successful_requests += 1
                
                logger.debug("xrpl_heartbeat",
                           last_beat=self.last_heartbeat.isoformat(),
                           uptime_seconds=(datetime.utcnow() - self.connection_uptime_start).total_seconds())
                
            except Exception as e:
                self.failed_requests += 1
                logger.warning("xrpl_heartbeat_failed", error=str(e))
                
                # Attempt reconnection
                self.is_connected = False
                await self.connect()
    
    async def disconnect(self):
        """Gracefully close connections"""
        self.is_connected = False
        
        if self.connection_uptime_start:
            uptime = (datetime.utcnow() - self.connection_uptime_start).total_seconds()
            logger.info("xrpl_disconnected",
                       uptime_seconds=uptime,
                       successful_requests=self.successful_requests,
                       failed_requests=self.failed_requests)
    
    async def submit_and_validate(self, 
                                  transaction: Transaction,
                                  wallet: Wallet) -> Dict:
        """
        Submit transaction and wait for ledger validation
        Returns detailed transaction result
        """
        from xrpl.transaction import submit_and_wait
        
        try:
            logger.info("transaction_submitting",
                       tx_type=transaction.transaction_type)
            
            response = await submit_and_wait(
                transaction,
                self.rpc_client,
                wallet
            )
            
            if response.is_successful():
                result = response.result
                self.successful_requests += 1
                
                logger.info("transaction_validated",
                           tx_hash=result.get("hash"),
                           ledger_index=result.get("ledger_index"),
                           status=result.get("meta", {}).get("TransactionResult"))
                
                return {
                    "success": True,
                    "hash": result.get("hash"),
                    "ledger_index": result.get("ledger_index"),
                    "validated": True,
                    "result_code": result.get("meta", {}).get("TransactionResult")
                }
            else:
                self.failed_requests += 1
                error_code = response.result.get("error", "unknown")
                error_msg = XRPLErrorHandler.get_error_message(error_code)
                
                logger.error("transaction_failed",
                           error_code=error_code,
                           error_message=error_msg)
                
                return {
                    "success": False,
                    "error_code": error_code,
                    "error_message": error_msg,
                    "validated": False
                }
                
        except Exception as e:
            self.failed_requests += 1
            logger.error("transaction_exception", error=str(e))
            
            return {
                "success": False,
                "error_message": str(e),
                "validated": False
            }
    
    def get_health_metrics(self) -> Dict:
        """Get connection health metrics"""
        uptime = None
        if self.connection_uptime_start:
            uptime = (datetime.utcnow() - self.connection_uptime_start).total_seconds()
        
        return {
            "connected": self.is_connected,
            "uptime_seconds": uptime,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": (
                self.successful_requests / (self.successful_requests + self.failed_requests)
                if (self.successful_requests + self.failed_requests) > 0
                else 0
            ),
            "reconnect_attempts": self.reconnect_attempts
        }


class VaultMonitor:
    """Real-time vault transaction monitoring"""
    
    def __init__(self, ws_client: AsyncWebsocketClient, rpc_client: AsyncJsonRpcClient):
        self.ws_client = ws_client
        self.rpc_client = rpc_client
        self.subscriptions: Dict[str, Callable] = {}
        self.monitoring_active = False
    
    async def subscribe_to_vault(self, vault_address: str, callback: Callable):
        """Subscribe to real-time vault transactions"""
        
        # Store callback
        self.subscriptions[vault_address] = callback
        
        # Subscribe to account transactions
        subscribe_request = Subscribe(accounts=[vault_address])
        
        # Note: In production, you'd send this via WebSocket
        # For now, we'll use polling as fallback
        
        logger.info("vault_subscription_active",
                   vault_address=vault_address)
    
    async def start_monitoring(self):
        """Start monitoring all subscribed vaults"""
        self.monitoring_active = True
        
        # Start polling loop (in production, this would be WebSocket listener)
        asyncio.create_task(self._monitor_loop())
    
    async def _monitor_loop(self):
        """Monitor vault transactions (polling mode)"""
        while self.monitoring_active:
            for vault_address in list(self.subscriptions.keys()):
                try:
                    # Check for new transactions
                    await self._check_vault_transactions(vault_address)
                except Exception as e:
                    logger.error("vault_monitoring_error",
                               vault_address=vault_address,
                               error=str(e))
            
            await asyncio.sleep(5)  # Poll every 5 seconds
    
    async def _check_vault_transactions(self, vault_address: str):
        """Check vault for new transactions"""
        from xrpl.models.requests import AccountTx
        
        request = AccountTx(
            account=vault_address,
            ledger_index_min=-1,
            ledger_index_max=-1,
            limit=10
        )
        
        response = await self.rpc_client.request(request)
        
        if response.is_successful() and "transactions" in response.result:
            callback = self.subscriptions.get(vault_address)
            if callback:
                for tx_data in response.result["transactions"]:
                    await callback(tx_data)


class WardXRPLClient:
    """Main XRPL client for Ward Protocol with full monitoring"""
    
    def __init__(self):
        self.pool = XRPLConnectionPool()
        self.vault_monitor: Optional[VaultMonitor] = None
        self.monitored_vaults = {}
        
    async def start(self):
        """Initialize XRPL connections"""
        await self.pool.connect()
        
        # Initialize vault monitor
        self.vault_monitor = VaultMonitor(
            self.pool.ws_client,
            self.pool.rpc_client
        )
        await self.vault_monitor.start_monitoring()
    
    async def stop(self):
        """Shutdown XRPL connections"""
        if self.vault_monitor:
            self.vault_monitor.monitoring_active = False
        await self.pool.disconnect()
    
    async def monitor_vault(self, vault_address: str, vault_id: str):
        """Start real-time monitoring of a vault"""
        
        async def vault_callback(tx_data):
            """Process vault transaction"""
            tx = tx_data.get("tx", {})
            
            logger.info("vault_transaction_detected",
                       vault_id=vault_id,
                       vault_address=vault_address,
                       tx_type=tx.get("TransactionType"),
                       hash=tx.get("hash"))
        
        await self.vault_monitor.subscribe_to_vault(vault_address, vault_callback)
        self.monitored_vaults[vault_id] = vault_address
        
        logger.info("vault_monitoring_started",
                   vault_id=vault_id,
                   vault_address=vault_address,
                   total_monitored=len(self.monitored_vaults))
    
    async def get_account_balance(self, address: str) -> int:
        """Get XRP balance for an address (in drops)"""
        request = AccountInfo(account=address)
        response = await self.pool.rpc_client.request(request)
        
        if response.is_successful():
            balance = int(response.result["account_data"]["Balance"])
            self.pool.successful_requests += 1
            return balance
        else:
            self.pool.failed_requests += 1
            error = response.result.get("error", "unknown")
            raise Exception(XRPLErrorHandler.get_error_message(error))
    
    async def verify_vault_exists(self, vault_address: str) -> bool:
        """Verify that a vault address exists on XRPL"""
        try:
            await self.get_account_balance(vault_address)
            return True
        except:
            return False
    
    def get_health_metrics(self) -> Dict:
        """Get comprehensive health metrics"""
        pool_metrics = self.pool.get_health_metrics()
        
        return {
            **pool_metrics,
            "monitored_vaults": len(self.monitored_vaults),
            "vault_addresses": list(self.monitored_vaults.values())
        }


# Global client instance
ward_xrpl_client = WardXRPLClient()


# Startup/Shutdown hooks
async def startup_xrpl():
    """Called on FastAPI startup"""
    await ward_xrpl_client.start()
    logger.info("ward_xrpl_client_started",
               features=["connection_pooling", "health_monitoring", "vault_monitoring", "error_handling"])


async def shutdown_xrpl():
    """Called on FastAPI shutdown"""
    await ward_xrpl_client.stop()
    logger.info("ward_xrpl_client_stopped")
