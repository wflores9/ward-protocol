#!/usr/bin/env python3
"""
Setup Ward Protocol testnet wallets.

Creates and funds wallets for:
- Ward Protocol operator (monitor, policies, escrow)
- Insurance pool (premium collection)
- Test depositor (policy purchaser)
"""

import asyncio
import json
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.wallet import Wallet
from xrpl.asyncio.account import get_balance


async def main():
    """Setup testnet wallets."""
    
    print("🏦 Ward Protocol - Testnet Wallet Setup")
    print("="*70)
    
    client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
    await client.open()
    
    wallets = {}
    
    # Generate wallets
    print("\n📝 Generating wallets...")
    
    # 1. Ward Operator Wallet (runs monitor, creates policies)
    ward_wallet = Wallet.create()
    wallets['ward_operator'] = {
        'address': ward_wallet.address,
        'seed': ward_wallet.seed,
        'purpose': 'Monitor defaults, create policies, manage escrows'
    }
    print(f"✅ Ward Operator: {ward_wallet.address}")
    
    # 2. Insurance Pool Wallet (receives premiums, pays claims)
    pool_wallet = Wallet.create()
    wallets['insurance_pool'] = {
        'address': pool_wallet.address,
        'seed': pool_wallet.seed,
        'purpose': 'Collect premiums, payout claims'
    }
    print(f"✅ Insurance Pool: {pool_wallet.address}")
    
    # 3. Test Depositor Wallet (buys policies)
    depositor_wallet = Wallet.create()
    wallets['test_depositor'] = {
        'address': depositor_wallet.address,
        'seed': depositor_wallet.seed,
        'purpose': 'Purchase insurance policies (test user)'
    }
    print(f"✅ Test Depositor: {depositor_wallet.address}")
    
    # Fund from faucet
    print("\n💰 Funding wallets from testnet faucet...")
    print("   (This may take 30-60 seconds)")
    
    from xrpl.asyncio.wallet import generate_faucet_wallet
    
    try:
        ward_funded = await generate_faucet_wallet(client)
        wallets['ward_operator']['address'] = ward_funded.address
        wallets['ward_operator']['seed'] = ward_funded.seed
        print(f"✅ Ward Operator funded: {ward_funded.address}")
        
        pool_funded = await generate_faucet_wallet(client)
        wallets['insurance_pool']['address'] = pool_funded.address
        wallets['insurance_pool']['seed'] = pool_funded.seed
        print(f"✅ Insurance Pool funded: {pool_funded.address}")
        
        depositor_funded = await generate_faucet_wallet(client)
        wallets['test_depositor']['address'] = depositor_funded.address
        wallets['test_depositor']['seed'] = depositor_funded.seed
        print(f"✅ Test Depositor funded: {depositor_funded.address}")
        
    except Exception as e:
        print(f"⚠️  Faucet error: {e}")
        print("   Using generated wallets (you'll need to fund manually)")
    
    # Check balances
    print("\n💵 Wallet Balances:")
    for name, info in wallets.items():
        try:
            balance = await get_balance(info['address'], client)
            print(f"   {name}: {balance} XRP")
        except:
            print(f"   {name}: Not funded")
    
    # Save to config file
    config_path = 'testnet_wallets.json'
    with open(config_path, 'w') as f:
        json.dump(wallets, f, indent=2)
    
    print(f"\n✅ Wallets saved to: {config_path}")
    print("\n⚠️  SECURITY WARNING:")
    print("   These are TESTNET wallets with public seeds.")
    print("   NEVER use these seeds on mainnet!")
    print("   NEVER send real XRP to these addresses!")
    
    # Create .env file
    print("\n📝 Creating .env file...")
    from datetime import datetime
    env_content = f"""# Ward Protocol Testnet Configuration
# Generated: {datetime.now().isoformat()}

# Database
DATABASE_URL=postgresql://ward:ward_secure_password_change_me@localhost/ward_protocol

# XRPL Testnet
XRPL_WEBSOCKET_URL=wss://s.altnet.rippletest.net:51233

# Ward Operator Wallet (Monitor, Policies, Escrow)
WARD_WALLET_SEED={wallets['ward_operator']['seed']}
WARD_WALLET_ADDRESS={wallets['ward_operator']['address']}

# Insurance Pool Wallet (Premium Collection, Claims)
POOL_WALLET_SEED={wallets['insurance_pool']['seed']}
POOL_WALLET_ADDRESS={wallets['insurance_pool']['address']}

# Test Depositor Wallet (Policy Purchase)
TEST_DEPOSITOR_SEED={wallets['test_depositor']['seed']}
TEST_DEPOSITOR_ADDRESS={wallets['test_depositor']['address']}

# Security
# WARNING: These are testnet credentials only!
# NEVER use on mainnet!
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file created")
    
    await client.close()
    
    print("\n" + "="*70)
    print("🎉 Testnet wallet setup complete!")
    print("\nNext steps:")
    print("1. Review wallets in testnet_wallets.json")
    print("2. Check .env file configuration")
    print("3. Run: python3 scripts/deploy_testnet.py")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())
