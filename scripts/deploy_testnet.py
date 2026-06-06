#!/usr/bin/env python3
"""
Deploy Ward Protocol to XRPL testnet.

Steps:
1. Load wallets from config
2. Connect to testnet
3. Create insurance pool in database
4. Start monitoring service
5. Display deployment info
"""

import asyncio
import json
import os
import sys

# Add SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.wallet import Wallet

from ward.database import WardDatabase
from ward.monitor import XLS66Monitor
from ward.pool import InsurancePool


async def main():
    """Deploy Ward Protocol to testnet."""
    
    print("🚀 Ward Protocol - Testnet Deployment")
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
    
    # Get database URL - try env file first, then environment variable
    database_url = None
    
    # Try loading from .env file
    if os.path.exists('.env'):
        print("\n📄 Loading .env file...")
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    database_url = line.split('=', 1)[1].strip()
                    print("✅ Loaded DATABASE_URL from .env")
                    break
    
    # Fallback to environment variable
    if not database_url:
        database_url = os.getenv('DATABASE_URL')
    
    # Final fallback to default
    if not database_url:
        database_url = os.getenv("WARD_DATABASE_URL")
        if not database_url:
            raise ValueError("WARD_DATABASE_URL environment variable is required. Never use default credentials.")
        print("⚠️  Using default DATABASE_URL")
    
    # Connect to testnet
    print("\n🌐 Connecting to testnet...")
    client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
    await client.open()
    print("✅ Connected to testnet")
    
    # Create wallet instances
    ward_wallet = Wallet.from_seed(wallets['ward_operator']['seed'])
    pool_wallet = Wallet.from_seed(wallets['insurance_pool']['seed'])
    
    print(f"\n👤 Ward Operator: {ward_wallet.address}")
    print(f"🏦 Insurance Pool: {pool_wallet.address}")
    
    # Connect to database
    print("\n💾 Connecting to database...")
    db = WardDatabase(database_url)
    await db.connect()
    print("✅ Connected to database")
    
    # Create insurance pool
    print("\n🏦 Creating insurance pool...")
    pool = InsurancePool(
        client=client,
        wallet=pool_wallet,
        database=db
    )
    
    pool_id = await pool.create_pool(
        initial_capital_xrp=1000.0,  # Start with 1000 XRP
        asset_type="XRP"
    )
    
    print(f"✅ Pool created: {pool_id}")
    
    # Get pool metrics
    metrics = await pool.get_metrics()
    
    # Display deployment info
    print("\n" + "="*70)
    print("🎉 DEPLOYMENT COMPLETE!")
    print("="*70)
    print("\n📊 Deployment Summary:")
    print(f"   Network:       XRPL Testnet")
    print(f"   Pool ID:       {pool_id}")
    print(f"   Pool Capital:  {metrics.total_capital / 1_000_000:,.0f} XRP")
    print(f"   Available:     {metrics.available_capital / 1_000_000:,.0f} XRP")
    print(f"   Coverage Ratio: {metrics.coverage_ratio_percent:.0f}% (infinite)")
    print(f"   Operator:      {ward_wallet.address}")
    print(f"   Pool Account:  {pool_wallet.address}")
    
    print("\n🔗 Testnet Explorer Links:")
    print(f"   Operator: https://testnet.xrpl.org/accounts/{ward_wallet.address}")
    print(f"   Pool:     https://testnet.xrpl.org/accounts/{pool_wallet.address}")
    
    print("\n🎯 Next Steps:")
    print("1. Start monitor:  python3 scripts/start_monitor.py")
    print("2. Create policy:  python3 sdk/python/examples/create_policy.py")
    print("3. View metrics:   python3 scripts/view_pool_metrics.py")
    
    print("\n⚠️  Note: Monitor is NOT started automatically.")
    print("   Start it manually to begin watching for defaults.")
    
    print("="*70)
    
    # Cleanup
    await db.disconnect()
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
