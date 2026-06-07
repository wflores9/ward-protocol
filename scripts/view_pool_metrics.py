#!/usr/bin/env python3
"""
View Ward Protocol insurance pool metrics.
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.wallet import Wallet

from ward.database import WardDatabase
from ward.pool import InsurancePool


async def main():
    """Display pool metrics."""
    
    print("📊 Ward Protocol - Pool Metrics")
    print("="*70 + "\n")
    
    # Load config
    with open('testnet_wallets.json', 'r') as f:
        wallets = json.load(f)
    
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
    
    # Connect
    client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
    await client.open()
    
    pool_wallet = Wallet.from_seed(wallets['insurance_pool']['seed'])
    
    db = WardDatabase(database_url)
    await db.connect()
    
    # Get all pools
    async with db.pool.acquire() as conn:
        pools = await conn.fetch("SELECT pool_id FROM insurance_pools ORDER BY pool_id")
    
    if not pools:
        print("❌ No insurance pools found")
        print("   Run: python3 scripts/deploy_testnet.py")
        await db.disconnect()
        await client.close()
        return
    
    # Display each pool
    for pool_row in pools:
        pool_id = str(pool_row['pool_id'])
        
        pool = InsurancePool(
            client=client,
            wallet=pool_wallet,
            database=db,
            pool_id=pool_id
        )
        
        metrics = await pool.get_metrics()
        
        print(f"🏦 Pool: {pool_id}")
        print("-" * 70)
        print(f"Account:           {metrics.amm_account}")
        print(f"Asset:             {metrics.asset_type}")
        print()
        print(f"💰 Capital:")
        print(f"   Total:          {metrics.total_capital / 1_000_000:,.2f} XRP")
        print(f"   Available:      {metrics.available_capital / 1_000_000:,.2f} XRP")
        print(f"   Locked:         {(metrics.total_capital - metrics.available_capital) / 1_000_000:,.2f} XRP")
        print()
        print(f"📊 Exposure:")
        print(f"   Total:          {metrics.total_exposure / 1_000_000:,.2f} XRP")
        print(f"   Policies:       {metrics.active_policies_count}")
        print()
        print(f"📈 Metrics:")
        
        if metrics.total_exposure > 0:
            print(f"   Coverage Ratio: {metrics.coverage_ratio_percent:.1f}%")
            health_icon = "✅" if metrics.is_healthy else "⚠️"
            print(f"   Health:         {health_icon} {'Healthy' if metrics.is_healthy else 'At Risk'}")
        else:
            print(f"   Coverage Ratio: ∞ (no policies)")
            print(f"   Health:         ✅ Healthy")
        
        can_issue = "✅ Yes" if metrics.can_issue_policies else "❌ No"
        print(f"   Can Issue:      {can_issue}")
        print()
        print(f"💸 Claims:")
        print(f"   Total Paid:     {metrics.total_claims_paid / 1_000_000:,.2f} XRP")
        print()
    
    # Get default events count
    async with db.pool.acquire() as conn:
        event_count = await conn.fetchval("SELECT COUNT(*) FROM default_events")
    
    print("="*70)
    print(f"📋 Total Default Events: {event_count}")
    print("="*70)
    
    await db.disconnect()
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
