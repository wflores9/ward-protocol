"""Test XLS-80 Permissioned Domain creation on testnet"""

import asyncio
import json
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.wallet import Wallet
from core.permissioned_domains import PermissionedDomainManager

async def test_domain_creation():
    with open('testnet_wallets.json', 'r') as f:
        wallets = json.load(f)
    
    ward_wallet = Wallet.from_seed(wallets['ward_operator']['seed'])
    
    print(f"Domain Owner: {ward_wallet.classic_address}")
    print(f"Testing XLS-80 on testnet...\n")
    
    async with AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233") as client:
        domain_mgr = PermissionedDomainManager(client)
        
        credentials = [
            {
                "issuer": wallets['insurance_pool']['address'],
                "credential_type": "ACCREDITED_INVESTOR"
            },
            {
                "issuer": wallets['ward_operator']['address'],
                "credential_type": "INSTITUTIONAL_KYC"
            }
        ]
        
        print("Creating Ward Protocol Institutional Domain...")
        for i, cred in enumerate(credentials, 1):
            print(f"  {i}. Issuer: {cred['issuer'][:15]}...")
            print(f"     Type: {cred['credential_type']}")
        
        result = await domain_mgr.create_domain(
            wallet=ward_wallet,
            accepted_credentials=credentials
        )
        
        print(f"\nSuccess: {result['success']}")
        
        if result['success']:
            print(f"Domain ID: {result['domain_id']}")
            print(f"TX Hash: {result['tx_hash']}")
            
            with open('ward_institutional_domain.json', 'w') as f:
                json.dump(result, f, indent=2)
            
            print(f"\nSaved to: ward_institutional_domain.json")
            print("\nWard Protocol is now compliance-ready!")
        else:
            print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_domain_creation())
