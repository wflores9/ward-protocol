"""
Test XLS-70 Credential verification for permissioned domain membership
"""

import asyncio
import json
from xrpl.asyncio.clients import AsyncWebsocketClient
from core.credential_checker import CredentialChecker

async def test_credential_verification():
    """Test credential verification and domain membership"""
    
    # Load domain info
    with open('ward_institutional_domain.json', 'r') as f:
        domain = json.load(f)
    
    # Load wallets
    with open('testnet_wallets.json', 'r') as f:
        wallets = json.load(f)
    
    print("Ward Protocol - Credential Verification Test")
    print("=" * 60)
    print(f"\nDomain ID: {domain['domain_id']}")
    print(f"Owner: {domain['owner']}")
    print(f"\nAccepted Credentials: {len(domain['accepted_credentials'])}")
    for i, cred in enumerate(domain['accepted_credentials'], 1):
        print(f"  {i}. {cred['credential_type']}")
        print(f"     Issuer: {cred['issuer'][:20]}...")
    
    # Connect to testnet
    async with AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233") as client:
        checker = CredentialChecker(client)
        
        # Test accounts
        test_accounts = [
            {
                "name": "Ward Operator",
                "address": wallets['ward_operator']['address']
            },
            {
                "name": "Insurance Pool",
                "address": wallets['insurance_pool']['address']
            },
            {
                "name": "Random Account",
                "address": "rN7n7otQDd6FczFgLdlqtyMVrn3HMfLT6z"
            }
        ]
        
        print("\n" + "=" * 60)
        print("Testing Domain Membership")
        print("=" * 60)
        
        for account in test_accounts:
            print(f"\nAccount: {account['name']}")
            print(f"Address: {account['address']}")
            
            # Check membership
            result = await checker.check_domain_membership(
                account['address'],
                domain['accepted_credentials']
            )
            
            print(f"  Is Member: {result['is_member']}")
            
            if result['is_member']:
                matching = result['matching_credential']
                print(f"  Matching Credential: {matching['credential_type']}")
                print(f"  Issuer: {matching['issuer'][:20]}...")
            else:
                print(f"  No matching credentials found")
            
            print(f"  Checked at: {result['checked_at']}")
        
        print("\n" + "=" * 60)
        print("Credential Verification Complete!")
        print("=" * 60)
        print(f"\nCache: {len(checker.cache)} entries")

if __name__ == "__main__":
    asyncio.run(test_credential_verification())
