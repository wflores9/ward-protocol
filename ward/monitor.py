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
    use ward.VaultMonitor which subscribes to
    the XRPL WebSocket ledger stream with 3-ledger confirmation.

        WARNING: This class monitors vault balance changes via POLLING only (every
            poll_interval_seconds). XRPL produces a new ledger every ~3-4 seconds.
                Polling can miss events between intervals and is NOT suitable for
                    production default detection.

                        For XLS-66 default detection with 3-ledger WebSocket confirmation, use:
                                from ward import VaultMonitor  # WebSocket + 3-ledger confirmation
    """

    def __init__(
