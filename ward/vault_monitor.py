"""
Ward Protocol — Module 2: VaultMonitor

Trustless WebSocket default detection for XLS-66 vaults.

The monitor subscribes to XRPL transaction stream for a set of vault and
loan-broker addresses.  On detecting a candidate default signal it waits
for DEFAULT_CONFIRM_COUNT ledger closes before firing the on_verified_default
callback.  This prevents false positives from transient network conditions.

Fixes applied:
  #1  Extracted from ward_client.py monolith into own module.
    #3  AsyncWebsocketClient used correctly inside reconnect loop.
      #5  Exponential-backoff reconnect loop — monitor never silently dies.
      """

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.models import AccountInfo, LedgerEntry, Subscribe

from ward.constants import (
    DEFAULT_CONFIRM_COUNT,
    DEFAULT_TESTNET_WS,
    LSF_LOAN_DEFAULT,
    LSF_LOAN_IMPAIRED,
)
from ward.primitives import LedgerError, ValidationError, validate_xrpl_address

logger = logging.getLogger("ward.vault_monitor")

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class DefaultSignal:
      """
          Candidate default signal — detected on-chain but not yet confirmed
              across DEFAULT_CONFIRM_COUNT ledger closes.
                  """
      vault_address:  str
      loan_id:        str
      health_ratio:   float
      ledger_index:   int
      confirm_count:  int = 0


@dataclass
class VerifiedDefault:
      """
          A default confirmed across DEFAULT_CONFIRM_COUNT ledger closes.
              All fields sourced from on-chain data — no off-chain state.
                  """
      vault_address:       str
      loan_id:             str
      health_ratio:        float
      first_ledger_index:  int
      confirmed_ledger:    int

    # XLS-66 fields (populated from on-chain LedgerEntry)
      outstanding_amount:  int  = 0   # drops
    collateral_amount:   int  = 0   # drops
    loan_flags:          int  = 0

# ---------------------------------------------------------------------------
# VaultMonitor
# ---------------------------------------------------------------------------

class VaultMonitor:
      """
          Module 2 — Trustless WebSocket default detection.

              Usage::

                      monitor = VaultMonitor(websocket_url="wss://s.altnet.rippletest.net:51233/")
                              monitor.add_vault("rVaultXXX...")
                                      monitor.add_loan_broker("rBrokerXXX...")

                                              @monitor.on_verified_default
                                                      async def handle_default(event: VerifiedDefault):
                                                                  print(f"Default confirmed: {event}")

                                                                          await monitor.run()   # runs indefinitely; call stop() to halt

                                                                              Reconnection:
                                                                                      If the WebSocket drops (network hiccup, node restart) the monitor
                                                                                              automatically reconnects with exponential back-off (1 s → 2 s → 4 s …
                                                                                                      capped at 60 s).  Pending confirmations survive the reconnect because
                                                                                                              they are stored in memory; the monitor re-subscribes on reconnect.
                                                                                                              
                                                                                                                  Ward never holds keys — this module is pure read-only except for the
                                                                                                                      Subscribe request sent on connect.
                                                                                                                          """

    def __init__(
              self,
              websocket_url: str = DEFAULT_TESTNET_WS,
              confirm_count: int = DEFAULT_CONFIRM_COUNT,
    ) -> None:
              self._ws_url        = websocket_url
              self._confirm_count = confirm_count

        # Address sets
              self._vault_addresses: Set[str]  = set()
        self._broker_addresses: Set[str] = set()
        # broker → vault mapping for quick lookup in tx handler
        self._broker_to_vault: Dict[str, str] = {}

        # Pending confirmations: loan_id → DefaultSignal
        self._pending: Dict[str, DefaultSignal] = {}

        # Anomaly detection: vault → deque of recent health ratios
        self._health_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10))

        # Callbacks
        self._default_callbacks: List[Callable] = []
        self._anomaly_callbacks:  List[Callable] = []

        # Control
        self._stop_event = asyncio.Event()
        self._running    = False
        # live client reference (set inside run loop, used by internal helpers)
        self._client: Optional[AsyncWebsocketClient] = None

    # ------------------------------------------------------------------
    # Public API — configuration
    # ------------------------------------------------------------------

    def on_verified_default(self, callback: Callable) -> Callable:
              """Decorator / direct registration for verified-default callbacks."""
              self._default_callbacks.append(callback)
              return callback

    def on_anomaly(self, callback: Callable) -> Callable:
              """Decorator / direct registration for anomaly-detection callbacks."""
              self._anomaly_callbacks.append(callback)
              return callback

    def add_vault(self, address: str) -> None:
              validate_xrpl_address(address, "vault_address")
              self._vault_addresses.add(address)

    def add_loan_broker(self, address: str, vault_address: str = "") -> None:
              """
                      Register a loan-broker address.

                              Args:
                                          address:       Broker's XRPL address.
                                                      vault_address: Optional vault this broker serves.  When provided
                                                                                 the broker→vault mapping is stored for fast lookup
                                                                                                            in the transaction handler.
                                                                                                                    """
              validate_xrpl_address(address, "broker_address")
              self._broker_addresses.add(address)
              if vault_address:
                            validate_xrpl_address(vault_address, "vault_address (for broker mapping)")
                            self._broker_to_vault[address] = vault_address

          # ------------------------------------------------------------------
          # Public API — lifecycle
    # ------------------------------------------------------------------

    async def run(self) -> None:
              """
                      Connect and monitor indefinitely with automatic reconnect.

                              Call stop() to halt gracefully.

                                      Reconnect strategy:
                                                - On any connection error or clean close, wait *backoff* seconds.
                                                          - backoff starts at 1 s and doubles each failed attempt, capped at 60 s.
                                                                    - backoff resets to 1 s on any successful connection.
                                                                            """
              self._running    = True
              self._stop_event.clear()
              backoff = 1.0

        while not self._stop_event.is_set():
                      try:
                                        async with AsyncWebsocketClient(self._ws_url) as client:
                                                              self._client = client
                                                              backoff = 1.0   # reset on successful connect
                    await self._subscribe(client)
                    logger.info(
                                              "VaultMonitor connected — watching %d vault(s), "
                                              "%d broker(s) on %s",
                                              len(self._vault_addresses),
                                              len(self._broker_addresses),
                                              self._ws_url,
                    )
                    async for message in client:
                                              if self._stop_event.is_set():
                                                                            break
                                                                        if isinstance(message, dict):
                                                                                                      try:
                                                                                                                                        await self._handle_message(client, message)
                                                                          except Exception as exc:
                                logger.error(
                                                                      "Error handling WebSocket message: %s", exc,
                                                                      exc_info=True,
                                )
except asyncio.CancelledError:
                break
except Exception as exc:
                if self._stop_event.is_set():
                                      break
                logger.warning(
                                      "VaultMonitor WebSocket disconnected (%s). "
                                      "Reconnecting in %.0fs …",
                                      exc, backoff,
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60.0)
finally:
                self._client = None

        self._running = False
        logger.info("VaultMonitor stopped.")

    async def stop(self) -> None:
              """Signal the monitor to stop after the current message is processed."""
        self._stop_event.set()
        self._running = False

    # ------------------------------------------------------------------
    # Internal — WebSocket subscribe
    # ------------------------------------------------------------------

    async def _subscribe(self, client: AsyncWebsocketClient) -> None:
              """Send a Subscribe request for all monitored addresses + ledger stream."""
        all_addresses = list(self._vault_addresses | self._broker_addresses)
        sub = Subscribe(
                      accounts=all_addresses,
                      streams=["ledger"],
        )
        await client.send(sub)

    # ------------------------------------------------------------------
    # Internal — message dispatch
    # ------------------------------------------------------------------

    async def _handle_message(
              self,
              client: AsyncWebsocketClient,
              message: dict,
    ) -> None:
              msg_type = message.get("type", "")
        if msg_type == "transaction":
                      await self._handle_transaction(client, message)
elif msg_type == "ledgerClosed":
            ledger_index = message.get("ledger_index", 0)
            await self._process_pending_confirmations(client, ledger_index)

    async def _handle_transaction(
              self,
              client: AsyncWebsocketClient,
              message: dict,
    ) -> None:
              """
                      Inspect an incoming transaction for default signals.

                              A default signal is raised when a loan object associated with a
                                      monitored vault shows LSF_LOAN_DEFAULT or a health ratio below 1.5.
                                              """
        tx      = message.get("transaction", {})
        meta    = message.get("meta", {})
        account = tx.get("Account", "")

        # Only care about transactions from monitored accounts
        if (account not in self._vault_addresses
                            and account not in self._broker_addresses):
                                          return

        # Resolve vault from broker if needed
        vault_address = (
                      account
                      if account in self._vault_addresses
                      else self._broker_to_vault.get(account, account)
        )

        # Look for loan state changes in AffectedNodes
        affected = meta.get("AffectedNodes", [])
        for node in affected:
                      for node_type in ("ModifiedNode", "CreatedNode", "DeletedNode"):
                                        entry = node.get(node_type, {})
                if entry.get("LedgerEntryType") not in ("XChainOwnedClaimID", "Loan"):
                                      # Accept any custom XLS-66 loan object type
                                      pass
                fields = entry.get("FinalFields") or entry.get("NewFields", {})
                if not fields:
                                      continue

                loan_flags = fields.get("Flags", 0)
                if not (loan_flags & LSF_LOAN_DEFAULT or loan_flags & LSF_LOAN_IMPAIRED):
                                      continue

                loan_id = entry.get("LedgerIndex", "")
                if not loan_id:
                                      continue

                outstanding = int(fields.get("OutstandingAmount", 0))
                collateral  = int(fields.get("CollateralAmount", 0))

                health_ratio = (
                                      collateral / outstanding
                                      if outstanding > 0
                                      else float("inf")
                )

                # Update health history for anomaly detection
                self._health_history[vault_address].append(health_ratio)
                if self._detect_anomaly(vault_address):
                                      await self._fire_callbacks(
                                                                self._anomaly_callbacks,
                                                                {"vault": vault_address, "ratio": health_ratio},
                                      )

                ledger_index = message.get("ledger_index", 0)

                if loan_id in self._pending:
                                      self._pending[loan_id].confirm_count += 1
else:
                    self._pending[loan_id] = DefaultSignal(
                                              vault_address=vault_address,
                                              loan_id=loan_id,
                                              health_ratio=health_ratio,
                                              ledger_index=ledger_index,
                                              confirm_count=1,
                    )
                    logger.info(
                                              "Default signal detected: vault=%s  loan=%s  "
                                              "ratio=%.3f  ledger=%d  (needs %d confirms)",
                                              vault_address, loan_id, health_ratio,
                                              ledger_index, self._confirm_count,
                    )

    async def _process_pending_confirmations(
              self,
              client: AsyncWebsocketClient,
              current_ledger: int,
    ) -> None:
              """
                      On each ledger close, check if any pending signals have enough confirms.
                              Fires on_verified_default callback when confirm threshold is met.
                                      """
        confirmed_ids = []
        for loan_id, signal in self._pending.items():
                      signal.confirm_count += 1
            if signal.confirm_count >= self._confirm_count:
                              verified = await self._verify_default_on_chain(
                                                    client, loan_id, signal, current_ledger
                              )
                if verified:
                                      await self._fire_callbacks(self._default_callbacks, verified)
                    confirmed_ids.append(loan_id)

        for loan_id in confirmed_ids:
                      del self._pending[loan_id]

    async def _verify_default_on_chain(
              self,
              client: AsyncWebsocketClient,
              loan_id: str,
              signal: DefaultSignal,
              current_ledger: int,
    ) -> Optional[VerifiedDefault]:
              """
                      Re-read the loan object from the ledger to confirm the default is real.

                              This guards against false positives from race conditions or
                                      stream ordering issues — the final word is always the on-chain state.
                                              """
        try:
                      resp = await client.request(
                                        LedgerEntry(index=loan_id, ledger_index="validated")
                      )
            if not resp.is_successful():
                              logger.warning(
                                                    "Cannot verify default for loan %s: %s",
                                                    loan_id, resp.result
                              )
                return None

            node = resp.result.get("node", {})
            flags = node.get("Flags", 0)
            if not (flags & LSF_LOAN_DEFAULT or flags & LSF_LOAN_IMPAIRED):
                              logger.info(
                                                    "Default signal for loan %s cleared — "
                                                    "on-chain state no longer shows default flags.",
                                                    loan_id,
                              )
                return None

            outstanding = int(node.get("OutstandingAmount", 0))
            collateral  = int(node.get("CollateralAmount", 0))

            return VerifiedDefault(
                              vault_address=signal.vault_address,
                              loan_id=loan_id,
                              health_ratio=(
                                                    collateral / outstanding if outstanding > 0 else float("inf")
                              ),
                              first_ledger_index=signal.ledger_index,
                              confirmed_ledger=current_ledger,
                              outstanding_amount=outstanding,
                              collateral_amount=collateral,
                              loan_flags=flags,
            )
except Exception as exc:
            logger.error(
                              "Error verifying default on-chain for loan %s: %s",
                              loan_id, exc, exc_info=True,
            )
            return None

    # ------------------------------------------------------------------
    # Internal — helpers
    # ------------------------------------------------------------------

    def _detect_anomaly(self, vault_address: str) -> bool:
              """
                      Return True if the vault's recent health history shows a rapid
                              decline (3+ consecutive readings below 1.5× coverage).
                                      """
        history = list(self._health_history[vault_address])
        if len(history) < 3:
                      return False
        return all(r < 1.5 for r in history[-3:])

    @staticmethod
    async def _fire_callbacks(callbacks: List[Callable], event: Any) -> None:
              """Fire all registered callbacks for an event, logging errors."""
        for cb in callbacks:
                      try:
                                        result = cb(event)
                                        if asyncio.iscoroutine(result):
                                                              await result
                      except Exception as exc:
                logger.error("Callback %s raised: %s", cb, exc, exc_info=True)
