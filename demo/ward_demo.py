#!/usr/bin/env python3
"""
Ward Protocol demo - TxBuilder, ChainReader, and Monitor usage.

Usage:
    export XRPL_WEBSOCKET_URL="wss://s.altnet.rippletest.net:51233"
    python demo/ward_demo.py
"""

import asyncio
import os
import sys

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from xrpl.asyncio.clients import AsyncWebsocketClient

from ward import TxBuilder, ChainReader, WardMonitor


async def demo_tx_builder() -> None:
    """Demonstrate TxBuilder (no submission)."""
    print("\n--- TxBuilder Demo ---")
    payment = TxBuilder.payment(
        account="rSource123",
        destination="rDest456",
        amount_drops=1_000_000,
        memos=[{"type": "ward_demo", "data": "hello"}],
    )
    print(f"Payment tx type: {payment.transaction_type}")
    print(f"Amount: {payment.amount} drops")

    escrow = TxBuilder.claim_escrow(
        account="rPool",
        destination="rClaimant",
        amount_drops=500_000,
        claim_id="claim-uuid-123",
    )
    print(f"Escrow tx type: {escrow.transaction_type}")
    print(f"Amount: {escrow.amount} drops")


async def demo_chain_reader(client: AsyncWebsocketClient) -> None:
    """Demonstrate ChainReader with a testnet faucet address."""
    print("\n--- ChainReader Demo ---")
    reader = ChainReader(client)

    # Use well-known testnet faucet address
    test_address = "rK4dpLy9bGVmNmnJNGzkHfNdhB7XzZh9iV"
    try:
        balance = await reader.get_account_balance(test_address)
        print(f"Address: {balance.address}")
        print(f"Balance: {balance.balance_xrp:.2f} XRP ({balance.balance_drops} drops)")
        print(f"Sequence: {balance.sequence}")
    except Exception as e:
        print(f"ChainReader error (network/account): {e}")

    exists = await reader.verify_account_exists(test_address)
    print(f"Account exists: {exists}")


async def demo_monitor(client: AsyncWebsocketClient) -> None:
    """Demonstrate WardMonitor (short run)."""
    print("\n--- WardMonitor Demo ---")
    monitor = WardMonitor(client, poll_interval_seconds=2)

    # Add faucet as "demo vault"
    monitor.add_vault("demo_vault", "rK4dpLy9bGVmNmnJNGzkHfNdhB7XzZh9iV")

    async def on_change(vault_id: str, address: str, prev: int, curr: int) -> None:
        print(f"  Balance changed: {prev} -> {curr} drops")

    monitor.on_balance_change("demo_vault", on_change)

    print("Polling for 6 seconds (2 polls)...")
    task = asyncio.create_task(monitor.start())
    await asyncio.sleep(6)
    monitor.stop()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    print("Monitor stopped.")


async def main() -> None:
    ws_url = os.getenv("XRPL_WEBSOCKET_URL", "wss://s.altnet.rippletest.net:51233")
    print(f"Using XRPL WebSocket: {ws_url}")

    await demo_tx_builder()

    async with AsyncWebsocketClient(ws_url) as client:
        await demo_chain_reader(client)
        await demo_monitor(client)

    print("\n--- Demo complete ---\n")


if __name__ == "__main__":
    asyncio.run(main())
