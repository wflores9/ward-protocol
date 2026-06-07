#!/usr/bin/env python3
"""
Start Ward Protocol monitoring service.

Monitors XRPL testnet for XLS-66 loan defaults and logs to database.
"""

import asyncio
import json
import os
import sys
import signal

# Add SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.wallet import Wallet

from ward.monitor import XLS66Monitor, DefaultEvent
from ward.database import WardDatabase


# Global monitor instance for cleanup
monitor = None


def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully."""
    print("\n\n⏹️  Received shutdown signal...")
    if monitor:
        asyncio.create_task(monitor.stop())
    sys.exit(0)


async def main():
    """Start the monitoring service."""
    global monitor
    
    print("🔍 Ward Protocol - Monitoring Service")
    print("="*70)
    
    # Load wallet config
    try:
        with open('testnet_wallets.json', 'r') as f:
            wallets = json.load(f)
        print("✅ Loaded wallet configuration")
    except FileNotFoundError:
        print("❌ testnet_wallets.json not found!")
        print("   Run: python3 scripts/setup_testnet_wallets.py")
        return
    
    # Get database URL
    database_url = None
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_url = line.split('=', 1)[1].strip()
                    break
    
    if not database_url:
        database_url = "postgresql://ward:ward_secure_password_change_me@localhost/ward_protocol"
    
    # Create wallet
    ward_wallet = Wallet.from_seed(wallets['ward_operator']['seed'])
    
    print(f"\n👤 Operator: {ward_wallet.address}")
    print(f"💾 Database: Connected")
    print(f"🌐 Network:  XRPL Testnet")
    
    # Create monitor
    monitor = XLS66Monitor(
        websocket_url="wss://s.altnet.rippletest.net:51233",
        database_url=database_url
    )
    
    # Register default handler
    @monitor.on_default
    async def handle_default(event: DefaultEvent):
        print("\n" + "="*70)
        print("🚨 DEFAULT DETECTED!")
        print("="*70)
        print(f"Loan:         {event.loan.loan_id[:16]}...")
        print(f"Borrower:     {event.loan.borrower}")
        print(f"Vault:        {event.vault.vault_id[:16]}...")
        print(f"Default:      {event.default_amount / 1_000_000:,.2f} XRP")
        print(f"Covered:      {event.default_covered / 1_000_000:,.2f} XRP")
        print(f"Vault Loss:   {event.vault_loss / 1_000_000:,.2f} XRP ⚠️")
        print(f"Transaction:  {event.tx_hash[:16]}...")
        print(f"Ledger:       {event.ledger_index}")
        print("="*70 + "\n")
    
    print("\n" + "="*70)
    print("🎯 MONITORING SERVICE STARTED")
    print("="*70)
    print("\n👀 Watching for XLS-66 loan defaults...")
    print("📊 Events will be logged to database")
    print("🔔 Alerts will appear in this terminal")
    print("\nPress Ctrl+C to stop\n")
    print("="*70 + "\n")
    
    # Register signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await monitor.start()
    except KeyboardInterrupt:
        print("\n⏹️  Stopping monitor...")
        await monitor.stop()
        print("✅ Monitor stopped")


if __name__ == "__main__":
    asyncio.run(main())
