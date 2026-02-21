"""Store Ward institutional domain in database"""

import json
import psycopg2

# Load domain info
with open('ward_institutional_domain.json', 'r') as f:
    domain = json.load(f)

print("Storing Ward institutional domain in database...")
print(f"Domain ID: {domain['domain_id']}")

# Connect using ward_user credentials
conn = psycopg2.connect(
    dbname="ward_protocol",
    user="ward_user",
    password="ward_protocol_2026",
    host="localhost"
)
conn.autocommit = True

with conn.cursor() as cur:
    # Insert domain
    cur.execute(
        """
        INSERT INTO permissioned_domains 
            (domain_id, owner_address, sequence, tx_hash, status)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (domain_id) DO UPDATE
        SET updated_at = NOW()
        """,
        (
            domain['domain_id'],
            domain['owner'],
            domain['sequence'],
            domain['tx_hash'],
            'active'
        )
    )
    
    print("✓ Domain stored")
    
    # Insert credentials
    for cred in domain['accepted_credentials']:
        cur.execute(
            """
            INSERT INTO domain_credentials
                (domain_id, issuer_address, credential_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (domain_id, issuer_address, credential_type) 
            DO NOTHING
            """,
            (
                domain['domain_id'],
                cred['issuer'],
                cred['credential_type']
            )
        )
        print(f"✓ Credential: {cred['credential_type']}")
    
    # Verify
    cur.execute(
        "SELECT COUNT(*) FROM domain_credentials WHERE domain_id = %s",
        (domain['domain_id'],)
    )
    count = cur.fetchone()[0]
    
    print(f"\n✓ Success! Domain stored with {count} credentials")

conn.close()
