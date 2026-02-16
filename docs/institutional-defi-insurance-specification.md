.<pre>
  xls: XXXX (pending - assigned on PR)
  title: Institutional DeFi Insurance Protocol
  description: Insurance layer for XLS-66 Lending Protocol enabling institutional lenders to insure against borrower defaults and vault depositor losses.
  author: Will Flores <wflores@wardprotocol.org>
  category: Ecosystem
  status: Draft
  proposal-from: [GitHub Discussion URL - to be created]
  requires: XLS-66, XLS-65
  created: 2026-02-15
  updated: 2026-02-16
</pre>

# Institutional DeFi Insurance Protocol

## 1. Abstract

Ward Protocol provides institutional-grade insurance coverage for vault depositors participating in the XLS-66 Lending Protocol on the XRP Ledger. The protocol enables vault depositors to purchase insurance policies that protect against losses exceeding First-Loss Capital protection when borrowers default. Ward Protocol operates as an ecosystem-level application using existing XRPL primitives (XLS-30 AMM pools, XLS-20 NFTs, Payment transactions, and Escrow) without requiring protocol amendments. Insurance pools aggregate institutional capital, collect premiums from protected depositors, and automatically process claims triggered by XLS-66 default events that result in vault asset losses.

## 2. Motivation

The XLS-66 Lending Protocol (deployed January 2026) enables fixed-term, fixed-rate loans on the XRP Ledger using pooled liquidity from XLS-65 Single Asset Vaults. While XLS-66 includes First-Loss Capital protection managed by LoanBrokers, vault depositors face significant uninsured risks when defaults exceed this protection:

### 2.1 The Uninsured Loss Gap

**XLS-66 First-Loss Capital Mechanics:**

When a borrower defaults on an XLS-66 loan, the loss calculation follows this formula (from XLS-66 specification):

```
DefaultAmount = Loan.PrincipalOutstanding + Loan.InterestOutstanding

MinimumCover = LoanBroker.DebtTotal × LoanBroker.CoverRateMinimum

DefaultCovered = min(
    MinimumCover × LoanBroker.CoverRateLiquidation,
    DefaultAmount,
    LoanBroker.CoverAvailable
)

VaultLoss = DefaultAmount - DefaultCovered
```

**Example Scenario:**
- Loan defaults: $55,000 owed (principal + interest)
- LoanBroker settings: 10% CoverRateMinimum, 50% CoverRateLiquidation
- First-Loss Capital available: $20,000
- Calculation: DefaultCovered = min($20K × 10% × 50%, $55K, $20K) = min($1K, $55K, $20K) = **$1,000**
- **Vault depositors lose: $55,000 - $1,000 = $54,000**

This uninsured gap creates several institutional barriers:

1. **First-Loss Capital Insufficiency**: LoanBrokers may set low coverage ratios (5-10%), leaving depositors exposed
2. **Capital Depletion**: Multiple defaults can exhaust first-loss reserves entirely
3. **Vault Share Devaluation**: Losses decrease `Vault.AssetsTotal`, reducing share value for all depositors
4. **Regulatory Capital Requirements**: Financial institutions cannot allocate capital without insurance coverage
5. **Impairment Risk**: `Vault.LossUnrealized` creates temporary share devaluation even before defaults occur

### 2.2 XLS-65 Vault Impact

When XLS-66 defaults occur, XLS-65 vault state changes directly impact depositor share values:

**Vault State Before Default:**
```
Vault.AssetsTotal:      $1,000,000
Vault.AssetsAvailable:    $800,000
Vault.LossUnrealized:          $0
Vault.SharesTotal:      1,000,000

Share Value = (AssetsTotal - LossUnrealized) / SharesTotal = $1.00
```

**Vault State After $50K Default (First-Loss: $5K):**
```
Vault.AssetsTotal:        $955,000  (-$45,000 uninsured loss)
Vault.AssetsAvailable:    $805,000  (+$5,000 from first-loss)
Vault.LossUnrealized:          $0
Vault.SharesTotal:      1,000,000

Share Value = $955,000 / 1,000,000 = $0.955 (-4.5% loss)
```

**Without insurance, ALL vault depositors absorb this loss proportionally.**

Ward Protocol addresses this gap by providing insurance that makes depositors whole when defaults exceed first-loss protection.

## 3. Specification

### 3.1 Core Architecture

Ward Protocol consists of six integrated components operating entirely at the ecosystem layer:

#### 3.1.1 Insurance Pool Management

Insurance pools aggregate capital using XLS-30 AMM (Automated Market Maker) pools:

- **Pool Asset**: XRP or RLUSD (matches the XLS-66 vault asset being insured)
- **Liquidity Providers**: Institutional capital allocators seeking insurance premium yield
- **Pool Shares**: AMM LP tokens representing proportional ownership of pool capital
- **Capital Requirements**: Minimum 200% coverage ratio (pool capital must exceed 2x total insured exposure)
- **Pool Structure**: Each asset type has dedicated pools (XRP pools insure XRP vaults, RLUSD pools insure RLUSD vaults)

**Pool Capitalization:**
```
Total Pool Capital:        $500,000
Active Policies Coverage:  $200,000
Coverage Ratio:            250% ✓
Status:                    HEALTHY
```

#### 3.1.2 Policy Issuance

Insurance policies are represented as XLS-20 NFTs with embedded metadata:

**NFT Metadata Schema:**
```json
{
  "protocol": "ward-v1",
  "policy_version": "1.0",
  "vault_id": "2DE64CA41250EF3CB7D2B127D6CEC31F747492CAE2BD1628CA02EA1FFE7475B3",
  "insured_address": "rN7n7otQDd6FczFgLdlqtyMVrn3LNU8Ki",
  "coverage_amount": "50000000000",
  "premium_paid": "500000000",
  "coverage_start": "2026-02-15T00:00:00Z",
  "coverage_end": "2026-05-15T00:00:00Z",
  "pool_id": "3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A",
  "policy_type": "vault_depositor_protection",
  "status": "active"
}
```

**Policy Creation Process:**
1. Depositor submits policy request with VaultID and coverage amount
2. Ward Protocol queries vault state via `ledger_entry` RPC
3. Risk assessment: vault health, LoanBroker coverage ratios, historical defaults
4. Premium calculation based on risk factors
5. Depositor sends Payment transaction with premium
6. Policy NFT minted and transferred to depositor address
7. Coverage begins immediately upon NFT receipt

**Premium Calculation Formula:**
```python
base_rate = 0.01 to 0.05  # 1-5% annually based on risk
term_factor = coverage_days / 365
risk_multiplier = calculate_vault_risk(vault_id)

premium = coverage_amount * base_rate * term_factor * risk_multiplier
```

**Risk Factors:**
- `Vault.LossUnrealized` level (higher = riskier)
- `LoanBroker.CoverAvailable / LoanBroker.DebtTotal` ratio (lower = riskier)
- Historical default rate for this LoanBroker
- Number of impaired loans (`lsfLoanImpaired` flag count)
- Average loan interest rate (higher rates indicate riskier borrowers)

#### 3.1.3 XLS-66 Default Monitoring

Ward Protocol monitors XLS-66 ledger state in real-time to detect default events:

**Monitored Ledger Objects:**

1. **Loan Objects** - Detect defaults:
```python
# Subscribe to Loan state changes
subscribe({
    "streams": ["ledger"],
    "accounts": [loan_broker_addresses]
})

# Check for default flag
if loan.Flags & lsfLoanDefault:
    trigger_claim_validation(loan)
```

2. **LoanBroker Objects** - Track first-loss capital:
```python
loan_broker = ledger_entry(loan_broker_id)

# Monitor these fields:
debt_total = loan_broker.DebtTotal
cover_available = loan_broker.CoverAvailable
cover_rate_minimum = loan_broker.CoverRateMinimum
cover_rate_liquidation = loan_broker.CoverRateLiquidation

# Calculate maximum possible coverage
max_coverage = (debt_total * cover_rate_minimum) * cover_rate_liquidation
```

3. **Vault Objects** - Verify depositor losses:
```python
vault = ledger_entry(vault_id)

# Track these fields for loss detection:
assets_total = vault.AssetsTotal
assets_available = vault.AssetsAvailable
loss_unrealized = vault.LossUnrealized
shares_total = vault.SharesTotal

# Calculate actual share value
share_value = (assets_total - loss_unrealized) / shares_total
```

**Default Detection Flow:**

```
1. WebSocket receives transaction notification
   ↓
2. Parse transaction type: LoanManage with tfLoanDefault
   ↓
3. Extract Loan metadata:
   - LoanID
   - PreviousTxnID (the LoanManage transaction)
   - LoanBrokerID
   - VaultID (from LoanBroker)
   ↓
4. Query transaction metadata to get exact loss amounts:
   tx_meta = get_transaction(PreviousTxnID)
   default_amount = extract_from_meta(tx_meta, "DefaultAmount")
   default_covered = extract_from_meta(tx_meta, "DefaultCovered")
   vault_loss = default_amount - default_covered
   ↓
5. Verify vault state change:
   vault_before = get_vault_state_at_ledger(tx_ledger_seq - 1)
   vault_after = get_vault_state_at_ledger(tx_ledger_seq)
   actual_loss = vault_before.AssetsTotal - vault_after.AssetsTotal
   assert vault_loss == actual_loss  # Sanity check
   ↓
6. Lookup active policies for this VaultID
   ↓
7. If policy exists and vault_loss > 0:
   initiate_claim_processing(policy_id, vault_loss)
```

**Key RPC Methods Used:**

```python
# Real-time monitoring
client.request(Subscribe(
    streams=["ledger"],
    accounts=monitored_loan_brokers
))

# State queries
client.request(LedgerEntry(
    loan_broker=loan_broker_id,
    ledger_index="validated"
))

client.request(LedgerEntry(
    vault=vault_id,
    ledger_index="validated"
))

# Transaction details
client.request(Tx(
    transaction=loan_manage_tx_hash,
    binary=False
))

# Historical analysis
client.request(AccountTx(
    account=loan_broker_address,
    ledger_index_min=-1,
    ledger_index_max=-1
))
```

#### 3.1.4 Claim Validation Logic

When a default is detected, Ward Protocol executes strict validation before processing claims:

**Step-by-Step Validation:**

```python
def validate_claim(loan_id: str, policy_id: str) -> ClaimResult:
    """
    Validates insurance claim against actual ledger state.
    
    Returns:
        ClaimResult with payout amount or rejection reason
    """
    
    # Step 1: Verify loan defaulted
    loan = get_loan(loan_id)
    if not (loan.Flags & lsfLoanDefault):
        return ClaimResult(approved=False, reason="Loan not defaulted")
    
    # Step 2: Get default transaction
    tx = get_transaction(loan.PreviousTxnID)
    if tx.TransactionType != "LoanManage":
        return ClaimResult(approved=False, reason="Invalid transaction type")
    
    # Step 3: Calculate loss from transaction metadata
    meta = tx.meta
    default_amount = parse_meta_field(meta, "DefaultAmount")
    default_covered = parse_meta_field(meta, "DefaultCovered")
    vault_loss = default_amount - default_covered
    
    if vault_loss <= 0:
        return ClaimResult(approved=False, reason="No vault loss occurred")
    
    # Step 4: Verify policy validity
    policy = get_policy(policy_id)
    
    if policy.status != "active":
        return ClaimResult(approved=False, reason="Policy not active")
    
    current_time = datetime.utcnow()
    if current_time < policy.coverage_start:
        return ClaimResult(approved=False, reason="Coverage not started")
    
    if current_time > policy.coverage_end:
        return ClaimResult(approved=False, reason="Policy expired")
    
    # Step 5: Verify vault matches policy
    loan_broker = get_loan_broker(loan.LoanBrokerID)
    
    if loan_broker.VaultID != policy.vault_id:
        return ClaimResult(approved=False, reason="VaultID mismatch")
    
    # Step 6: Calculate payout amount
    payout = min(vault_loss, policy.coverage_amount)
    
    # Step 7: Verify pool has sufficient capital
    pool = get_pool(policy.pool_id)
    
    if pool.available_capital < payout:
        return ClaimResult(approved=False, reason="Insufficient pool capital")
    
    # Step 8: Check coverage ratio would remain healthy
    pool.total_exposure -= payout  # Simulate payout
    coverage_ratio = pool.available_capital / pool.total_exposure
    
    if coverage_ratio < 2.0:  # 200% minimum
        return ClaimResult(approved=False, reason="Would breach coverage ratio")
    
    # Step 9: Approve claim
    return ClaimResult(
        approved=True,
        payout=payout,
        vault_loss=vault_loss,
        policy_coverage=policy.coverage_amount,
        claim_id=generate_claim_id()
    )
```

**Validation Checkpoints:**

| Check | Validation | Rejection Reason |
|-------|------------|------------------|
| 1. Loan Status | `Loan.Flags & lsfLoanDefault` | "Loan not defaulted" |
| 2. Transaction Type | `tx.TransactionType == "LoanManage"` | "Invalid transaction" |
| 3. Loss Amount | `VaultLoss > 0` | "No vault loss" |
| 4. Policy Status | `policy.status == "active"` | "Policy inactive" |
| 5. Coverage Window | `start < now < end` | "Outside coverage period" |
| 6. Vault Match | `LoanBroker.VaultID == policy.vault_id` | "VaultID mismatch" |
| 7. Pool Capital | `pool.capital >= payout` | "Insufficient capital" |
| 8. Coverage Ratio | `ratio >= 200%` after payout | "Ratio breach" |

#### 3.1.5 Claim Settlement Process

Once validated, claims are settled via Escrow to enable dispute resolution:

**Settlement Flow:**

```
1. Claim Validated
   ↓
2. Create EscrowCreate Transaction:
   {
     "TransactionType": "EscrowCreate",
     "Account": pool_hot_wallet,
     "Destination": policy.insured_address,
     "Amount": claim_payout_drops,
     "FinishAfter": ripple_time + 172800,  // 48 hours
     "DestinationTag": claim_id,
     "Memos": [{
       "Memo": {
         "MemoType": "ward_claim",
         "MemoData": hex(claim_details_json)
       }
     }]
   }
   ↓
3. Submit and wait for validation
   ↓
4. 48-Hour Dispute Window
   - Monitor for fraud signals
   - Community review period
   - Multi-sig can cancel if suspicious
   ↓
5. If no disputes, execute EscrowFinish:
   {
     "TransactionType": "EscrowFinish",
     "Owner": pool_hot_wallet,
     "OfferSequence": escrow_sequence
   }
   ↓
6. Funds transferred to insured depositor
   ↓
7. Update policy NFT metadata:
   {
     "status": "claimed",
     "claim_date": "2026-02-16T12:00:00Z",
     "claim_amount": "45000000000",
     "claim_id": "claim_abc123"
   }
```

**Dispute Mechanisms:**

Large claims (> 10% of pool capital) require additional approval:

```python
if claim_payout > pool.total_capital * 0.10:
    # Require 3-of-5 multi-signature approval
    escrow_tx.Signers = [
        {"Account": signer1, "TxnSignature": sig1},
        {"Account": signer2, "TxnSignature": sig2},
        {"Account": signer3, "TxnSignature": sig3}
    ]
```

**Settlement Timeline:**

| Time | Event | Action |
|------|-------|--------|
| T+0 | Default detected | Ward monitor triggers validation |
| T+5min | Validation complete | Claim approved or rejected |
| T+10min | Escrow created | 48-hour lock begins |
| T+48hr | Dispute window closes | EscrowFinish eligible |
| T+48hr+5min | Settlement | Funds transferred to depositor |

#### 3.1.6 Premium Collection

Premiums are collected via standard Payment transactions:

**Premium Payment Flow:**

```
1. Policy request submitted (off-chain or via Payment memo)
   ↓
2. Ward calculates premium based on:
   - Coverage amount
   - Vault risk metrics
   - Term duration
   - Pool capacity
   ↓
3. Premium invoice generated
   ↓
4. Depositor sends Payment:
   {
     "TransactionType": "Payment",
     "Account": depositor_address,
     "Destination": pool_premium_account,
     "Amount": premium_drops,
     "DestinationTag": policy_request_id,
     "Memos": [{
       "Memo": {
         "MemoType": "ward_premium",
         "MemoData": hex({"vault_id": "...", "coverage": "50000"})
       }
     }]
   }
   ↓
5. Ward detects payment via WebSocket
   ↓
6. Verify payment amount matches invoice
   ↓
7. Mint policy NFT and transfer to depositor
   ↓
8. Premium deposited into pool AMM via AMMDeposit
```

**Premium Allocation:**

- **95%** → Insurance pool AMM (available for claims)
- **4%** → Pool reserves (buffer for large claims)
- **1%** → Protocol development fee (optional, governance-controlled)

### 3.2 Technical Implementation

#### 3.2.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Ward Protocol Architecture                 │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   XRPL Mainnet       │
│                      │
│  ┌────────────────┐  │
│  │ XLS-66 Loans   │◄─┼─── WebSocket Subscribe
│  │ LoanBrokers    │  │
│  │ Vaults (XLS-65)│  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Ward Insurance │◄─┼─── Policy NFTs (XLS-20)
│  │ Pool AMMs      │  │     Escrow Settlements
│  │ (XLS-30)       │  │     Premium Payments
│  └────────────────┘  │
└──────────┬───────────┘
           │
           │ RPC/WebSocket
           ▼
┌────────────────────────────────────────────┐
│      Ward Protocol Backend Services        │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Event Monitor (Python)              │ │
│  │  - Subscribe to LoanManage txs       │ │
│  │  - Parse transaction metadata        │ │
│  │  - Detect default events             │ │
│  │  - Query vault state changes         │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Claim Validator (Python)            │ │
│  │  - Validate default occurred         │ │
│  │  - Calculate vault loss              │ │
│  │  - Verify policy coverage            │ │
│  │  - Check pool capital adequacy       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Settlement Engine (Python)          │ │
│  │  - Create escrow transactions        │ │
│  │  - Monitor dispute window            │ │
│  │  - Execute claim payouts             │ │
│  │  - Update policy NFT metadata        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  PostgreSQL Database                 │ │
│  │  - Policy registry                   │ │
│  │  - Claims history                    │ │
│  │  - Vault monitoring state            │ │
│  │  - Pool metrics                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

#### 3.2.2 Database Schema

**PostgreSQL Tables:**

```sql
-- Policies
CREATE TABLE policies (
    policy_id UUID PRIMARY KEY,
    nft_token_id VARCHAR(64) UNIQUE NOT NULL,
    vault_id VARCHAR(64) NOT NULL,
    insured_address VARCHAR(50) NOT NULL,
    coverage_amount BIGINT NOT NULL,
    premium_paid BIGINT NOT NULL,
    coverage_start TIMESTAMP NOT NULL,
    coverage_end TIMESTAMP NOT NULL,
    pool_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_vault (vault_id),
    INDEX idx_status (status),
    INDEX idx_coverage_end (coverage_end)
);

-- Claims
CREATE TABLE claims (
    claim_id UUID PRIMARY KEY,
    policy_id UUID REFERENCES policies(policy_id),
    loan_id VARCHAR(64) NOT NULL,
    loan_manage_tx_hash VARCHAR(64) NOT NULL,
    default_amount BIGINT NOT NULL,
    default_covered BIGINT NOT NULL,
    vault_loss BIGINT NOT NULL,
    claim_payout BIGINT NOT NULL,
    escrow_sequence INTEGER,
    escrow_tx_hash VARCHAR(64),
    settlement_tx_hash VARCHAR(64),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    settled_at TIMESTAMP,
    INDEX idx_policy (policy_id),
    INDEX idx_status (status),
    INDEX idx_loan (loan_id)
);

-- Monitored Vaults
CREATE TABLE monitored_vaults (
    vault_id VARCHAR(64) PRIMARY KEY,
    loan_broker_id VARCHAR(64) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,
    assets_total BIGINT NOT NULL,
    assets_available BIGINT NOT NULL,
    loss_unrealized BIGINT NOT NULL,
    shares_total BIGINT NOT NULL,
    last_updated_ledger INTEGER NOT NULL,
    last_checked TIMESTAMP DEFAULT NOW(),
    INDEX idx_loan_broker (loan_broker_id)
);

-- Loan Tracking
CREATE TABLE loans (
    loan_id VARCHAR(64) PRIMARY KEY,
    loan_broker_id VARCHAR(64) NOT NULL,
    borrower_address VARCHAR(50) NOT NULL,
    principal_outstanding BIGINT NOT NULL,
    total_value_outstanding BIGINT NOT NULL,
    next_payment_due TIMESTAMP,
    grace_period INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    flags INTEGER NOT NULL,
    last_updated_ledger INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_loan_broker (loan_broker_id),
    INDEX idx_status (status),
    INDEX idx_due_date (next_payment_due)
);

-- Insurance Pools
CREATE TABLE insurance_pools (
    pool_id VARCHAR(64) PRIMARY KEY,
    amm_account VARCHAR(50) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,
    total_capital BIGINT NOT NULL,
    available_capital BIGINT NOT NULL,
    total_exposure BIGINT NOT NULL,
    coverage_ratio DECIMAL(5,2) NOT NULL,
    active_policies_count INTEGER NOT NULL,
    total_claims_paid BIGINT NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

#### 3.2.3 Python SDK Structure

**Repository: `ward-protocol/sdk/python/`**

```
ward/
├── __init__.py
├── client.py          # XRPL client wrapper
├── monitor.py         # XLS-66 event monitoring
├── pool.py            # AMM pool management
├── policy.py          # NFT policy operations
├── claims.py          # Claim processing engine
├── escrow.py          # Escrow management
├── models/
│   ├── __init__.py
│   ├── policy.py      # Policy data models
│   ├── claim.py       # Claim data models
│   ├── vault.py       # Vault state models
│   └── loan.py        # Loan state models
└── utils/
    ├── __init__.py
    ├── calculations.py # Premium/claim calculations
    └── validation.py   # Input validation
```

**Example SDK Usage:**

```python
from ward import WardClient, VaultMonitor, ClaimProcessor
from xrpl.clients import JsonRpcClient

# Initialize
xrpl_client = JsonRpcClient("https://xrplcluster.com")
ward = WardClient(xrpl_client, db_url="postgresql://...")

# Start monitoring XLS-66 vaults
monitor = VaultMonitor(ward)
monitor.add_vault("2DE64CA41250EF3CB7D2B127D6CEC31F747492CAE2BD1628CA02EA1FFE7475B3")
monitor.start()

# Process claims automatically
claim_processor = ClaimProcessor(ward)

@monitor.on_default
def handle_default(event):
    loan_id = event.loan_id
    vault_loss = event.vault_loss
    
    # Check for active policies
    policies = ward.get_active_policies(vault_id=event.vault_id)
    
    for policy in policies:
        # Validate claim
        result = claim_processor.validate_claim(loan_id, policy.id)
        
        if result.approved:
            # Create escrow for payout
            escrow = claim_processor.create_escrow(
                policy=policy,
                payout=result.payout,
                claim_id=result.claim_id
            )
            print(f"Claim approved: {result.claim_id}, Payout: {result.payout}")
```

### 3.3 Security Considerations

#### 3.3.1 Oracle Risk

**Risk**: Claim validation depends on accurate XLS-66 state monitoring.

**Mitigation:**
- Multiple independent monitoring nodes (minimum 3)
- Consensus requirement: 3-of-5 nodes must agree on default event
- 48-hour escrow delay enables manual review
- Transaction hash verification against public ledger
- Immutable ledger state prevents data manipulation

#### 3.3.2 Capital Adequacy

**Risk**: Pool insolvency if claims exceed reserves.

**Mitigation:**
- Strict 200% coverage ratio enforced programmatically
- Real-time reserve monitoring
- Automatic policy sales halt at 250% threshold warning
- LP capital calls triggered at warning levels
- Per-pool isolation (XRP pools cannot cover RLUSD claims)

#### 3.3.3 Key Management

**Risk**: Pool wallet compromise could drain insurance capital.

**Mitigation:**
- Multi-signature requirements (3-of-5 institutional signers)
- Hardware wallet cold storage for > 99% of reserves
- Hot wallet limited to 1% of pool capital (for automated claims)
- Time-delayed withdrawals for amounts > 5% of pool
- Regular key rotation (quarterly)
- Geographic distribution of signers

#### 3.3.4 Smart Contract Risk

**Mitigation**: Ward Protocol uses ZERO custom smart contracts. All logic executes in audited off-chain services using only native XRPL transactions.

#### 3.3.5 Claim Front-Running

**Risk**: Malicious actors attempt to purchase policies immediately before known defaults.

**Mitigation:**
- Minimum coverage start delay: 24 hours after policy purchase
- Historical loan performance analysis before policy issuance
- `Vault.LossUnrealized` monitoring (reject policies on vaults with high impaired loan exposure)
- Retroactive fraud detection (NFT burning, premium forfeiture)

## 4. Rationale

### 4.1 Why Ecosystem (Not Amendment)?

**Decision: XLS-103 as Ecosystem proposal**

This approach was chosen strategically:

1. **Rapid Market Entry**: Deploy in weeks (not months/years waiting for validator voting)
2. **Demand Validation**: Prove institutional appetite before proposing protocol changes
3. **XLS-66 Integration Window**: Lending protocol just launched (Jan 2026) - early mover advantage
4. **Iteration Speed**: Fix bugs and adjust economics quickly without consensus
5. **Future Upgrade Path**: If successful, propose XLS-104 amendment for native insurance primitives

**Considered Alternative: Full Amendment (XLS-104d)**

A protocol-level insurance amendment would add:
- `InsurancePolicy` ledger object (native, not NFT)
- `PolicyClaim` transaction type (automated settlement, no escrow delay)
- Native claim validation hooks in `LoanManage` transaction
- Lower operational costs (no monitoring infrastructure needed)

**This remains viable for Phase 2 if Ward Protocol achieves product-market fit.**

### 4.2 XLS-20 NFTs for Policies

**Why NFTs instead of custom ledger objects?**

1. **Transferability**: Depositors can sell policies on secondary markets
2. **Existing Infrastructure**: NFT marketplaces, wallets, explorers all work immediately
3. **Metadata Flexibility**: Policy terms stored in standard URI format
4. **No Amendment Required**: Deploy today using existing primitives
5. **Composability**: Policies can be used as collateral in other DeFi protocols

### 4.3 XLS-30 AMM for Pool Management

**Why AMM instead of custom pool contract?**

1. **Battle-Tested**: AMM code audited and proven on mainnet
2. **Fair Pricing**: LP shares automatically priced by market dynamics
3. **Liquidity**: LPs can enter/exit without permission
4. **No Trust Assumptions**: Decentralized, permissionless capital aggregation
5. **Yield Generation**: Premiums accrue as AMM fees, increasing LP token value

### 4.4 Integration with XLS-66 (Not XLS-67 or Other Lending)

**Why focus exclusively on XLS-66?**

1. **Greenfield Opportunity**: XLS-66 just launched (Jan 2026), no existing insurance competitors
2. **Institutional Target Market**: Payment processors, market makers, fintechs - aligned with Ward's focus
3. **Uncollateralized Lending**: Highest insurance demand (vs. overcollateralized DeFi)
4. **Clear Integration Points**: First-Loss Capital provides natural insurance layer boundary
5. **Fixed-Term Structure**: Predictable policy durations match loan terms

**Future Expansion**: Ward Protocol architecture is extensible to other lending protocols (XLS-67, etc.) once proven with XLS-66.

## 5. Backwards Compatibility

Ward Protocol operates entirely at the ecosystem layer using existing XRPL primitives. No backwards compatibility concerns exist.

**Future Compatibility:**
- Policy NFT metadata is versioned (`"policy_version": "1.0"`) to support schema evolution
- If XLS-66 undergoes amendments, Ward monitoring logic adapts without blockchain changes
- Pool contracts designed to accommodate native insurance (XLS-104) if later deployed

## 6. Reference Implementation

**Repository**: https://github.com/wflores9/ward-protocol

**Documentation**: 
- Integration diagrams: `/docs/ward-integration-diagrams.md`
- API reference: `/docs/api-reference.md` (coming soon)
- Deployment guide: `/docs/deployment.md` (coming soon)

**SDK Availability**:
- Python SDK: `pip install ward-protocol` (testnet release: March 2026)
- JavaScript SDK: Planned for Q2 2026
- Rust SDK: Community-driven, timeline TBD

## 7. Test Plan

### Phase 1: Testnet Validation (Weeks 1-4)

**Week 1: Infrastructure Setup**
- Deploy PostgreSQL database
- Configure XRPL testnet node
- Deploy monitoring services
- Create test insurance pool AMM

**Week 2: XLS-66 Integration Testing**
- Monitor live testnet XLS-66 vaults
- Subscribe to LoanManage transactions
- Parse default event metadata
- Verify loss calculations match spec

**Week 3: Policy & Claims Testing**
- Mint test policy NFTs
- Simulate default scenarios
- Execute claim validation logic
- Test escrow settlement flow

**Week 4: Stress Testing**
- 100+ concurrent default events
- Pool capital depletion scenarios
- Edge cases (expired policies, insufficient capital)
- Multi-sig approval workflows

### Phase 2: Mainnet Pilot (Months 2-3)

**Pilot Parameters:**
- Single XRP-denominated pool ($50K initial capital)
- Whitelisted participants only (10 institutional depositors)
- Maximum $100K total insured exposure
- Manual claim approval override (safety mechanism)

**Success Criteria:**
- Zero false claim approvals
- < 5 second default detection latency
- 100% claim settlement accuracy
- > 99.9% monitoring uptime

### Phase 3: Public Launch (Month 4+)

**Launch Criteria:**
- Pilot completes with zero incidents
- 3rd party security audit completed
- Multi-sig governance established
- Comprehensive documentation published

**Public Launch Features:**
- Multiple asset pools (XRP, RLUSD)
- Permissionless policy purchases
- Automated claim processing (no manual override)
- Community governance for pool parameters

## 8. Security Audit Plan

**Pre-Launch Requirements:**

1. **Code Audit** (Trail of Bits or equivalent)
   - Python monitoring services
   - Database schema security
   - Key management implementation
   - Transaction construction logic

2. **Economic Audit** (Gauntlet or equivalent)
   - Premium pricing models
   - Pool reserve requirements
   - Coverage ratio simulations
   - Stress test scenarios

3. **Operational Security Review**
   - Multi-sig setup validation
   - Cold storage procedures
   - Hot wallet limits enforcement
   - Incident response plan

## Appendix A: Integration Diagrams

For visual architecture diagrams showing Ward Protocol integration with XLS-66 and XLS-65, see:

**`/docs/ward-integration-diagrams.md`**

This document includes:
- ASCII architecture diagram
- Component interaction flow
- Default event timeline
- Claim settlement pipeline
- Mermaid diagrams (GitHub rendering)

## Appendix B: Calculations Reference

### B.1 XLS-66 Default Loss Calculation

```python
def calculate_vault_loss(loan: Loan, loan_broker: LoanBroker) -> int:
    """
    Calculate vault depositor loss from XLS-66 loan default.
    
    Formula from XLS-66 specification section 4.2.3.
    """
    default_amount = (
        loan.PrincipalOutstanding + 
        loan.InterestOutstanding
    )
    
    minimum_cover = (
        loan_broker.DebtTotal * 
        loan_broker.CoverRateMinimum
    )
    
    default_covered = min(
        minimum_cover * loan_broker.CoverRateLiquidation,
        default_amount,
        loan_broker.CoverAvailable
    )
    
    vault_loss = default_amount - default_covered
    
    return vault_loss
```

### B.2 XLS-65 Share Value Impact

```python
def calculate_share_value_impact(
    vault_before: Vault,
    vault_loss: int
) -> dict:
    """
    Calculate impact of vault loss on depositor share values.
    
    Uses XLS-65 share value formula.
    """
    # Share value before default
    value_before = (
        (vault_before.AssetsTotal - vault_before.LossUnrealized) /
        vault_before.SharesTotal
    )
    
    # Share value after default
    assets_total_after = vault_before.AssetsTotal - vault_loss
    value_after = (
        (assets_total_after - vault_before.LossUnrealized) /
        vault_before.SharesTotal
    )
    
    # Calculate loss per share
    loss_per_share = value_before - value_after
    loss_percentage = (loss_per_share / value_before) * 100
    
    return {
        "share_value_before": value_before,
        "share_value_after": value_after,
        "loss_per_share": loss_per_share,
        "loss_percentage": loss_percentage,
        "total_vault_loss": vault_loss
    }
```

### B.3 Premium Pricing Formula

```python
def calculate_premium(
    coverage_amount: int,
    term_days: int,
    vault_id: str,
    loan_broker_id: str
) -> int:
    """
    Calculate insurance premium based on risk factors.
    """
    # Base annual rate (1-5% based on risk tier)
    base_rate = calculate_base_rate(vault_id, loan_broker_id)
    
    # Risk multiplier from vault/broker health
    risk_multiplier = calculate_risk_multiplier(
        vault_id, 
        loan_broker_id
    )
    
    # Term adjustment
    term_factor = term_days / 365
    
    # Final premium
    premium = (
        coverage_amount * 
        base_rate * 
        term_factor * 
        risk_multiplier
    )
    
    return int(premium)

def calculate_base_rate(vault_id: str, loan_broker_id: str) -> float:
    """
    Determine base rate tier (1-5% annually).
    """
    vault = get_vault(vault_id)
    loan_broker = get_loan_broker(loan_broker_id)
    
    # Risk factors
    utilization = loan_broker.DebtTotal / vault.AssetsTotal
    coverage_ratio = (
        loan_broker.CoverAvailable / 
        (loan_broker.DebtTotal * loan_broker.CoverRateMinimum)
    )
    impairment_ratio = vault.LossUnrealized / vault.AssetsTotal
    
    # Tier assignment
    if coverage_ratio >= 2.0 and impairment_ratio < 0.01:
        return 0.01  # 1% - safest tier
    elif coverage_ratio >= 1.5 and impairment_ratio < 0.05:
        return 0.02  # 2%
    elif coverage_ratio >= 1.0 and impairment_ratio < 0.10:
        return 0.03  # 3%
    elif coverage_ratio >= 0.5 and impairment_ratio < 0.20:
        return 0.04  # 4%
    else:
        return 0.05  # 5% - riskiest tier
```

### B.4 Pool Coverage Ratio

```python
def check_pool_health(pool_id: str) -> dict:
    """
    Calculate insurance pool coverage ratio and health status.
    """
    pool = get_pool(pool_id)
    
    # Query all active policies for this pool
    policies = get_active_policies(pool_id=pool_id)
    
    total_exposure = sum(p.coverage_amount for p in policies)
    coverage_ratio = pool.available_capital / total_exposure
    
    # Health status
    if coverage_ratio >= 3.0:
        status = "OPTIMAL"
    elif coverage_ratio >= 2.5:
        status = "HEALTHY"
    elif coverage_ratio >= 2.0:
        status = "MINIMUM"
    else:
        status = "CRITICAL"  # Halt new policy sales
    
    return {
        "pool_id": pool_id,
        "available_capital": pool.available_capital,
        "total_exposure": total_exposure,
        "coverage_ratio": coverage_ratio,
        "status": status,
        "can_sell_policies": coverage_ratio >= 2.0
    }
```

## Appendix C: FAQ

### C.1 How does Ward Protocol differ from traditional insurance?

Ward is decentralized peer-to-peer insurance:
- No central company
- Capital providers earn yield directly
- Claims settled automatically via blockchain state
- Transparent, auditable on public ledger

Traditional insurance has:
- Central underwriter
- Opaque claim processes
- Manual adjudication
- Regulatory overhead

### C.2 What happens if defaults exceed pool capital?

**Short answer**: Policies have maximum coverage limits enforced by the 200% rule.

**Long answer**: 
- Pools can only insure up to 50% of capital (200% ratio)
- Example: $500K pool can insure maximum $250K exposure
- If multiple defaults occur, claims paid in order received
- Once capital depleted to 200% threshold, new sales halt automatically
- LPs can add capital or existing policies expire to restore ratio

### C.3 Can I sell my insurance policy?

**Yes.** Policies are XLS-20 NFTs, fully transferable:
- List on NFT marketplaces
- Sell OTC to other depositors
- Use as collateral (if lending protocol supports NFT collateral)
- Transfer to different wallet

**Secondary market enables:**
- Exit coverage early if you withdraw from vault
- Hedge insurance exposure
- Liquidity for policy holders

### C.4 What if XLS-66 changes?

Ward Protocol monitors XLS-66 ledger objects, not smart contracts.

**If XLS-66 undergoes amendments:**
- Ward monitoring logic updates (off-chain)
- Policy terms remain valid
- No disruption to existing coverage
- SDK updates to support new XLS-66 features

**Backward compatibility guaranteed** because XLS-66 data structures are versioned.

### C.5 Why 48-hour escrow delay for claims?

**Purpose**: Fraud detection and dispute resolution.

**Benefits:**
- Community can review claim legitimacy
- Multi-sig can cancel suspicious claims
- Provides time to investigate edge cases
- Reduces risk of oracle manipulation

**Downside:**
- Depositors wait 48hrs for payout

**Future**: If Ward achieves strong track record, governance may reduce delay to 24hrs.

### C.6 How are pool LPs compensated?

**LP Revenue Sources:**
1. **Premium Income**: 95% of premiums deposited into AMM
2. **AMM Trading Fees**: If pool asset is tradeable
3. **Appreciation**: Premiums > Claims = LP token value increases

**Target Returns**: 8-15% APY (risk-adjusted)

**Risk**: Claims can exceed premiums (LP token value decreases)

### C.7 What loans are eligible for insurance?

**Current Eligibility (Pilot Phase):**
- XLS-66 fixed-term loans only
- Maximum 90-day term
- Minimum 5% first-loss capital
- Whitelisted LoanBroker addresses

**Future Expansion:**
- Longer terms (180 days)
- Lower first-loss thresholds
- All XLS-66 loans (permissionless)
- Other lending protocols (XLS-67, etc.)

### C.8 Does Ward Protocol have a governance token?

**Current**: No governance token.

**Future Consideration**: If community desires, may introduce:
- Governance token for pool parameter control
- Token-weighted voting on:
  - Coverage ratio requirements
  - Premium fee distribution
  - Claim approval thresholds
  - Protocol development priorities

**Not Required**: Multi-sig signers can govern without token.

---

## Security Contact

**Found a security issue?**

Email: **security@wardprotocol.org**

**Bug Bounty Program**: Coming soon (testnet launch)

**Security Features:**
- Multi-signature pool management (3-of-5 institutional signers)
- 200% reserve ratio minimum (programmatically enforced)
- 48-hour escrow claim validation period
- Zero custom smart contracts (uses only native XRPL primitives)
- Independent monitoring nodes with consensus mechanism

---

**End of Specification**
\
*For implementation details and visual diagrams, see `/docs/ward-integration-diagrams.md`*
