"""
Ward Protocol monitor - vault and loan default monitoring.

Wraps chain reader for polling-based monitoring of vault addresses
and XLS-66 loan defaults.
"""

import asyncio
import logging
from typing import Callable, Optional, Dict, List, Awaitable

from xrpl.asyncio.clients import AsyncWebsocketClient

from .chain_reader import ChainReader

logger = logging.getLogger(__name__)


class WardMonitor:
    """
    Monitor vaults and accounts for Ward Protocol.

    Uses ChainReader for polling. For full XLS-66 default detection,
    use sdk/python/ward/monitor.XLS66Monitor which subscribes to
    the ledger stream.
    """

    def __init__(
        self,
        client: AsyncWebsocketClient,
        *,
        poll_interval_seconds: float = 5.0,
    ):
        """
        Initialize monitor.

        Args:
            client: XRPL client for chain reads
            poll_interval_seconds: Interval between balance checks
        """
        self.client = client
        self.reader = ChainReader(client)
        self.poll_interval = poll_interval_seconds
        self._monitored: Dict[str, str] = {}  # vault_id -> address
        self._callbacks: Dict[str, Callable[..., Awaitable[None]]] = {}
        self._running = False
        self._last_balances: Dict[str, int] = {}

    def add_vault(self, vault_id: str, vault_address: str) -> None:
        """Add a vault to monitor."""
        self._monitored[vault_id] = vault_address
        logger.info("monitor_added_vault", vault_id=vault_id, address=vault_address)

    def remove_vault(self, vault_id: str) -> None:
        """Remove a vault from monitoring."""
        self._monitored.pop(vault_id, None)
        self._last_balances.pop(vault_id, None)
        self._callbacks.pop(vault_id, None)

    def on_balance_change(self, vault_id: str, callback: Callable[..., Awaitable[None]]) -> None:
        """Register callback for balance changes (async)."""
        self._callbacks[vault_id] = callback

    async def start(self) -> None:
        """Start polling loop."""
        self._running = True
        logger.info(
            "ward_monitor_started",
            vault_count=len(self._monitored),
            poll_interval=self.poll_interval,
        )
        while self._running:
            await self._poll()
            await asyncio.sleep(self.poll_interval)

    def stop(self) -> None:
        """Stop monitoring."""
        self._running = False
        logger.info("ward_monitor_stopped", vault_count=len(self._monitored))

    async def _poll(self) -> None:
        """Poll all monitored vaults for balance changes."""
        for vault_id, address in list(self._monitored.items()):
            try:
                balance = await self.reader.get_account_balance(address)
                prev = self._last_balances.get(vault_id)
                self._last_balances[vault_id] = balance.balance_drops
                if prev is not None and prev != balance.balance_drops:
                    cb = self._callbacks.get(vault_id)
                    if cb:
                        try:
                            if asyncio.iscoroutinefunction(cb):
                                await cb(vault_id, address, prev, balance.balance_drops)
                            else:
                                cb(vault_id, address, prev, balance.balance_drops)
                        except Exception as e:
                            logger.error("monitor_callback_error vault_id=%s error=%s", vault_id, str(e))
            except Exception as e:
                logger.warning("monitor_poll_error vault_id=%s address=%s error=%s", vault_id, address, str(e))
