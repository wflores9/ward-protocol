"""
F·03 — Vault Monitor
====================
Connects to the XRPL ledger stream via WebSocket and monitors vault accounts
for on-chain default events.

Requires 3 consecutive ledger closes with LSF_LOAN_DEFAULT set before firing
the on_verified_default callback (3-ledger confirmation invariant).

Reconnects automatically with exponential back-off (1 s → 60 s max).
Heartbeat: reconnects if no ledger event arrives within 60 seconds.

    ward_signed = False   # Monitor never signs anything

Usage:
    python starter/python/03_vault_monitor.py

Prerequisites:
    pip install xrpl-py python-dotenv
    VAULT_ADDRESS must be set in .env
"""

from __future__ import annotations

import asyncio
import os
import signal

from dotenv import load_dotenv

from ward import VaultMonitor, VerifiedDefault
from ward.constants import DEFAULT_TESTNET_WS

load_dotenv()

VAULT_ADDR = os.getenv("VAULT_ADDRESS", "")
WS_URL     = os.getenv("XRPL_WS_URL", DEFAULT_TESTNET_WS)


async def main() -> None:
    if not VAULT_ADDR:
        print("Set VAULT_ADDRESS in .env")
        return

    print(f"VaultMonitor starting …")
    print(f"  Monitoring  : {VAULT_ADDR}")
    print(f"  WebSocket   : {WS_URL}")
    print(f"  Heartbeat   : 60 s (reconnects if no ledger event)")
    print(f"  Confirms    : 3 ledger closes required")
    print()

    monitor = VaultMonitor(
        vault_addresses=[VAULT_ADDR],
        websocket_url=WS_URL,
        confirm_count=3,
    )

    @monitor.on_verified_default
    async def handle_default(event: VerifiedDefault) -> None:
        print(f"\n{'='*60}")
        print(f"  DEFAULT CONFIRMED")
        print(f"{'='*60}")
        print(f"  vault_address      : {event.vault_address}")
        print(f"  loan_id            : {event.loan_id}")
        print(f"  health_ratio       : {event.health_ratio:.4f}")
        print(f"  first_ledger       : {event.first_ledger_index}")
        print(f"  confirmed_ledger   : {event.confirmed_ledger}")
        print(f"  outstanding_amount : {event.outstanding_amount:,} drops")
        print(f"  collateral_amount  : {event.collateral_amount:,} drops")
        print(f"  loan_flags         : 0x{event.loan_flags:08x}")
        print()
        # In production: trigger ClaimValidator.validate_claim() here
        # then build and submit the settlement escrow.

    # Graceful shutdown on SIGINT
    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGINT, lambda: asyncio.create_task(monitor.stop()))

    print("Listening … (Ctrl+C to stop)")
    await monitor.run()
    print("\nVaultMonitor stopped.")


if __name__ == "__main__":
    asyncio.run(main())
