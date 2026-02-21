"""Test domain API endpoints"""

import requests
import json

BASE_URL = "https://api.wardprotocol.org"

# Load API key
with open('testnet_wallets.json', 'r') as f:
    wallets = json.load(f)

API_KEY = "ward_admin_2026"  # Admin key

print("Testing Ward Protocol Domain API")
print("=" * 60)

# Test 1: List all domains
print("\n1. GET /domains - List all domains")
response = requests.get(
    f"{BASE_URL}/domains",
    headers={"X-API-Key": API_KEY}
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    domains = response.json()
    print(f"Found {len(domains)} domain(s)")
    for domain in domains:
        print(f"  - {domain['domain_id'][:20]}... (Owner: {domain['owner'][:15]}...)")
else:
    print(f"Error: {response.text}")

# Test 2: Get specific domain
print("\n2. GET /domains/{domain_id} - Get domain details")
with open('ward_institutional_domain.json', 'r') as f:
    domain_info = json.load(f)

response = requests.get(
    f"{BASE_URL}/domains/{domain_info['domain_id']}",
    headers={"X-API-Key": API_KEY}
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    domain = response.json()
    print(f"Domain ID: {domain['domain_id'][:20]}...")
    print(f"Owner: {domain['owner']}")
    print(f"Credentials: {len(domain['accepted_credentials'])}")
    for cred in domain['accepted_credentials']:
        print(f"  - {cred['credential_type']}")
else:
    print(f"Error: {response.text}")

# Test 3: Check membership
print("\n3. POST /domains/{domain_id}/check-membership")
test_accounts = [
    ("Ward Operator", wallets['ward_operator']['address']),
    ("Insurance Pool", wallets['insurance_pool']['address'])
]

for name, address in test_accounts:
    response = requests.post(
        f"{BASE_URL}/domains/{domain_info['domain_id']}/check-membership",
        headers={"X-API-Key": API_KEY},
        json={"account": address}
    )
    print(f"\n{name} ({address[:15]}...)")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Is Member: {result['is_member']}")
        if result['matching_credential']:
            print(f"  Credential: {result['matching_credential']}")
    else:
        print(f"  Error: {response.text}")

print("\n" + "=" * 60)
print("Domain API testing complete!")
