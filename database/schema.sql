-- Ward Protocol Database Schema
-- PostgreSQL 14+

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_token_id VARCHAR(64) UNIQUE NOT NULL,
    vault_id VARCHAR(64) NOT NULL,
    insured_address VARCHAR(50) NOT NULL,
    coverage_amount BIGINT NOT NULL,
    premium_paid BIGINT NOT NULL,
    coverage_start TIMESTAMP NOT NULL,
    coverage_end TIMESTAMP NOT NULL,
    pool_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_vault ON policies(vault_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_coverage_end ON policies(coverage_end);
CREATE INDEX IF NOT EXISTS idx_policies_insured ON policies(insured_address);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(policy_id),
    loan_id VARCHAR(64) NOT NULL,
    loan_manage_tx_hash VARCHAR(64) NOT NULL UNIQUE,
    loan_broker_id VARCHAR(64) NOT NULL,
    vault_id VARCHAR(64) NOT NULL,
    default_amount BIGINT NOT NULL,
    default_covered BIGINT NOT NULL,
    vault_loss BIGINT NOT NULL,
    claim_payout BIGINT NOT NULL,
    escrow_sequence INTEGER,
    escrow_tx_hash VARCHAR(64),
    settlement_tx_hash VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    settled_at TIMESTAMP,
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_loan ON claims(loan_id);
CREATE INDEX IF NOT EXISTS idx_claims_vault ON claims(vault_id);
CREATE INDEX IF NOT EXISTS idx_claims_tx ON claims(loan_manage_tx_hash);

-- Monitored vaults table
CREATE TABLE IF NOT EXISTS monitored_vaults (
    vault_id VARCHAR(64) PRIMARY KEY,
    loan_broker_id VARCHAR(64) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,
    assets_total BIGINT NOT NULL,
    assets_available BIGINT NOT NULL,
    loss_unrealized BIGINT NOT NULL,
    shares_total BIGINT NOT NULL,
    share_value DECIMAL(20, 6),
    last_updated_ledger INTEGER NOT NULL,
    last_checked TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitored_vaults_broker ON monitored_vaults(loan_broker_id);

-- Loan tracking table
CREATE TABLE IF NOT EXISTS loans (
    loan_id VARCHAR(64) PRIMARY KEY,
    loan_broker_id VARCHAR(64) NOT NULL,
    borrower_address VARCHAR(50) NOT NULL,
    principal_outstanding BIGINT NOT NULL,
    total_value_outstanding BIGINT NOT NULL,
    interest_outstanding BIGINT NOT NULL,
    next_payment_due TIMESTAMP,
    grace_period INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    flags INTEGER NOT NULL,
    is_defaulted BOOLEAN DEFAULT FALSE,
    is_impaired BOOLEAN DEFAULT FALSE,
    last_updated_ledger INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_broker ON loans(loan_broker_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_loans_defaulted ON loans(is_defaulted);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(next_payment_due);

-- Insurance pools table
CREATE TABLE IF NOT EXISTS insurance_pools (
    pool_id VARCHAR(64) PRIMARY KEY,
    amm_account VARCHAR(50) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,
    total_capital BIGINT NOT NULL,
    available_capital BIGINT NOT NULL,
    total_exposure BIGINT NOT NULL,
    coverage_ratio DECIMAL(5, 2) NOT NULL,
    active_policies_count INTEGER NOT NULL DEFAULT 0,
    total_claims_paid BIGINT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Default events log (for analytics)
CREATE TABLE IF NOT EXISTS default_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id VARCHAR(64) NOT NULL,
    loan_broker_id VARCHAR(64) NOT NULL,
    vault_id VARCHAR(64) NOT NULL,
    borrower_address VARCHAR(50) NOT NULL,
    default_amount BIGINT NOT NULL,
    default_covered BIGINT NOT NULL,
    vault_loss BIGINT NOT NULL,
    tx_hash VARCHAR(64) NOT NULL UNIQUE,
    ledger_index INTEGER NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_default_events_loan ON default_events(loan_id);
CREATE INDEX IF NOT EXISTS idx_default_events_vault ON default_events(vault_id);
CREATE INDEX IF NOT EXISTS idx_default_events_tx ON default_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_default_events_date ON default_events(detected_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
