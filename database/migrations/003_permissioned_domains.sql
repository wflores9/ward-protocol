-- XLS-80 Permissioned Domains Schema
-- Stores domain info and credential requirements for institutional compliance

-- Permissioned Domains table
CREATE TABLE IF NOT EXISTS permissioned_domains (
    domain_id VARCHAR(66) PRIMARY KEY,
    owner_address VARCHAR(34) NOT NULL,
    sequence INTEGER NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(owner_address, sequence)
);

-- Domain Credentials table
CREATE TABLE IF NOT EXISTS domain_credentials (
    id SERIAL PRIMARY KEY,
    domain_id VARCHAR(66) REFERENCES permissioned_domains(domain_id) ON DELETE CASCADE,
    issuer_address VARCHAR(34) NOT NULL,
    credential_type VARCHAR(128) NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(domain_id, issuer_address, credential_type)
);

-- Credential verification cache
CREATE TABLE IF NOT EXISTS credential_cache (
    account_address VARCHAR(34) NOT NULL,
    issuer_address VARCHAR(34) NOT NULL,
    credential_type VARCHAR(128) NOT NULL,
    has_credential BOOLEAN NOT NULL,
    checked_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (account_address, issuer_address, credential_type)
);

-- Domain membership cache
CREATE TABLE IF NOT EXISTS domain_membership_cache (
    account_address VARCHAR(34) NOT NULL,
    domain_id VARCHAR(66) REFERENCES permissioned_domains(domain_id) ON DELETE CASCADE,
    is_member BOOLEAN NOT NULL,
    matching_credential_type VARCHAR(128),
    checked_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (account_address, domain_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_owner ON permissioned_domains(owner_address);
CREATE INDEX IF NOT EXISTS idx_domains_status ON permissioned_domains(status);
CREATE INDEX IF NOT EXISTS idx_domain_creds_domain ON domain_credentials(domain_id);
CREATE INDEX IF NOT EXISTS idx_cred_cache_account ON credential_cache(account_address);
CREATE INDEX IF NOT EXISTS idx_membership_cache_account ON domain_membership_cache(account_address);
