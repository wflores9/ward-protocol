<pre>
  xls: 103
  title: Institutional DeFi Insurance Protocol
  description: Insurance layer for XLS-66 Lending Protocol enabling institutional lenders to insure against borrower defaults and liquidation losses.
  author: Will Flores <wflores@wardprotocol.org>
  category: Ecosystem
  status: Draft
  proposal-from: [GitHub Discussion URL - to be created]
  requires: XLS-66, XLS-65
  created: 2026-02-15
  updated: 2026-02-15
</pre>

# Institutional DeFi Insurance Protocol

## 1. Abstract

Ward Protocol provides institutional-grade insurance coverage for lenders participating in the XLS-66 Lending Protocol on the XRP Ledger. The protocol enables lenders to purchase insurance policies that protect against borrower defaults, liquidation slippage, and first-loss capital depletion. Ward Protocol operates as an ecosystem-level application using existing XRPL primitives (XLS-66 Vaults, XLS-30 AMM pools, Payment transactions, XLS-20 NFTs, and Escrow) without requiring protocol amendments. Insurance pools aggregate institutional capital, collect premiums from protected lenders, and automatically process claims triggered by XLS-66 liquidation events.

## 2. Motivation

The XLS-66 Lending Protocol (deployed January 2026) enables fixed-term, uncollateralized loans on the XRP Ledger using pooled liquidity from Single Asset Vaults. While XLS-66 includes First-Loss Capital protection for vault depositors, institutional lenders face significant uninsured risks:

1. **First-Loss Capital Depletion**: If defaults exceed the first-loss reserve, lenders absorb losses directly
2. **Liquidation Slippage**: Market volatility during liquidation can result in losses not covered by first-loss capital
3. **Borrower Default Risk**: Uncollateralized lending exposes lenders to credit risk beyond first-loss protection
4. **Regulatory Capital Requirements**: Financial institutions require insurance coverage to allocate capital to DeFi lending

Existing XRPL primitives provide the necessary infrastructure to build an insurance layer without protocol modifications. This ecosystem approach enables rapid deployment while proving the demand for institutional DeFi insurance before proposing future protocol-level enhancements.

## 3. Specification

### 3.1 Core Architecture

Ward Protocol consists of five integrated components:

#### 3.1.1 Insurance Pool Management

Insurance pools aggregate capital using XLS-30 AMM (Automated Market Maker) pools:

- **Pool Asset**: XRP or RLUSD (matches the XLS-66 vault asset being insured)
- **Liquidity Providers**: Institutional capital allocators seeking insurance premium yield
- **Pool Shares**: AMM LP tokens representing proportional ownership of pool capital
- **Capital Requirements**: Minimum 200% coverage ratio (pool capital must exceed 2x insured exposure)

#### 3.1.2 Policy Issuance

Insurance policies are represented as XLS-20 NFTs with embedded metadata:

**NFT Metadata Fields**:
```json
{
  "insured_vault_id": "vault://...",
  "insured_address": "rXXX...",
  "coverage_amount": "1000000",
  "premium_amount": "10000",
  "coverage_start": "2026-02-15T00:00:00Z",
  "coverage_end": "2026-05-15T00:00:00Z",
  "pool_id": "pool://...",
  "policy_type": "default_protection"
}
```

**Policy Creation Process**:
1. Lender submits policy request (off-chain or via Payment with memo)
2. Ward Protocol validates vault state via XLS-66 RPC calls
3. Premium payment collected via Payment transaction
4. Policy NFT minted and transferred to insured address
5. Coverage begins immediately upon NFT receipt

#### 3.1.3 Premium Collection

Premiums are collected via standard Payment transactions:

**Premium Calculation**:
- Base rate: 1-5% of coverage amount annually (risk-adjusted)
- Payment frequency: Upfront for term duration
- Formula: `premium = coverage_amount * annual_rate * (term_days / 365)`

**Payment Flow**:
```
Insured Lender → Payment(premium) → Insurance Pool AMM
```

#### 3.1.4 Claim Processing

Claims are triggered automatically by monitoring XLS-66 liquidation events:

**Claim Triggering Conditions**:
1. XLS-66 loan enters liquidation state
2. Liquidation proceeds < outstanding loan balance
3. First-loss capital fully depleted
4. Policy NFT valid and active

**Claim Settlement Process**:
1. Ward Protocol monitors XLS-66 ledger entries for liquidation events
2. Calculate actual loss: `loss = loan_balance - liquidation_proceeds - first_loss_payout`
3. Verify policy coverage: `min(loss, coverage_amount)`
4. Execute claim payment via Escrow with 48-hour time-lock
5. Update policy NFT metadata with claim status

**Escrow Structure**:
```json
{
  "Account": "pool_address",
  "Destination": "insured_address",
  "Amount": "claim_amount",
  "FinishAfter": "ripple_time + 172800",  // 48 hours
  "Condition": "claim_validation_hash"
}
```

#### 3.1.5 XLS-66 Integration

Ward Protocol integrates with XLS-66 by monitoring specific ledger objects and transactions:

**Monitored XLS-66 Objects**:
- `LoanBroker` ledger entries (track first-loss capital levels)
- `Loan` ledger entries (track loan status and liquidation events)
- `Vault` ledger entries (track vault health and deposits)

**RPC Methods Used**:
- `ledger_entry` - Query loan and vault state
- `subscribe` - Real-time monitoring of liquidation events
- `account_tx` - Historical loan performance analysis

### 3.2 Implementation Requirements

#### 3.2.1 Off-Chain Components

**Ward Protocol Node** (Python-based):
- XLS-66 event monitoring service
- Premium calculation engine
- Claim validation logic
- Policy NFT minting service

**Database Requirements** (PostgreSQL):
- Policy registry
- Claims history
- Pool performance metrics
- XLS-66 loan tracking

#### 3.2.2 On-Chain Components

**Smart Wallet Configuration**:
- Multi-signature pool management (3-of-5 institutional signers)
- Hot wallet for automated claim payments (< 1% of pool capital)
- Cold storage for pool reserves (> 99% of pool capital)

**Transaction Types Used**:
- `Payment` - Premium collection and claim payouts
- `NFTokenMint` - Policy certificate issuance
- `NFTokenBurn` - Policy expiration/cancellation
- `EscrowCreate` - Time-locked claim settlements
- `EscrowFinish` - Claim release after validation period
- `AMMDeposit` - Pool capitalization
- `AMMWithdraw` - LP redemptions

### 3.3 Security Model

#### 3.3.1 Risk Isolation

Each insurance pool is isolated by asset type:
- XRP lending insurance uses XRP-denominated pools
- RLUSD lending insurance uses RLUSD-denominated pools
- No cross-asset contagion risk

#### 3.3.2 Capital Reserve Requirements

Pools maintain strict reserve ratios:
- **Minimum Coverage Ratio**: 200% (2:1 capital to exposure)
- **Warning Threshold**: 250% (triggers new LP capital calls)
- **Optimal Target**: 300% (healthy operational range)

#### 3.3.3 Claim Validation

48-hour Escrow period enables:
- Community review of claim legitimacy
- Fraud detection and dispute resolution
- Multi-signature claim approval for large payouts (> 10% of pool)

## 4. Rationale

### 4.1 Ecosystem vs. Amendment Approach

**Decision: Start with Ecosystem category**

This approach was chosen for several strategic reasons:

1. **Rapid Deployment**: No validator voting required, testnet deployment in weeks
2. **Market Validation**: Prove demand before proposing protocol changes
3. **Flexibility**: Iterate quickly based on institutional feedback
4. **XLS-66 Integration**: Leverage newly deployed lending infrastructure immediately
5. **Future Upgrade Path**: Design accommodates future amendment (XLS-104) if needed

**Considered Alternative: Full Amendment (XLS-104)**

A protocol-level amendment would add:
- Native `InsurancePolicy` ledger object
- `PolicyClaim` transaction type
- Automatic claim settlement without Escrow delay
- Lower operational costs (no off-chain monitoring)

This remains a viable future upgrade if ecosystem adoption proves demand.

### 4.2 Use of Existing Primitives

**XLS-20 NFTs for Policies**:
- Transferable (enables secondary insurance market)
- Metadata storage for policy terms
- Ownership verification built-in
- No additional ledger objects required

**XLS-30 AMM for Pool Management**:
- Proven liquidity mechanism
- Fair LP share pricing
- Automatic rebalancing
- No custom pool implementation needed

**Escrow for Claims**:
- Time-locked safety mechanism
- Dispute resolution window
- Trustless settlement
- Native XRPL primitive

### 4.3 Integration with XLS-66

**Why XLS-66 is the Perfect Target**:
1. Newly deployed (January 2026) - early mover advantage
2. Institutional focus - aligned customer base
3. Uncollateralized lending - highest insurance demand
4. First-loss capital mechanism - clear insurance layer integration point
5. Fixed-term loans - predictable policy duration

## 5. Backwards Compatibility

Ward Protocol operates entirely at the ecosystem layer using existing XRPL transactions and ledger objects. No backwards compatibility issues exist.

**Future Compatibility Considerations**:
- If XLS-66 undergoes amendments, Ward Protocol monitoring logic must adapt
- Policy NFT metadata schema is versioned to support future enhancements
- Pool contracts designed to accommodate protocol-level insurance (XLS-104) if deployed

## 6. Test Plan

### 6.1 Testnet Deployment

**Phase 1: Core Functionality (Weeks 1-2)**
1. Deploy insurance pool AMM on testnet
2. Mint test policy NFTs
3. Simulate premium payments
4. Monitor testnet XLS-66 vaults

**Phase 2: Integration Testing (Weeks 3-4)**
1. Create test XLS-66 loans
2. Trigger simulated defaults
3. Execute automated claims
4. Validate Escrow settlement

**Phase 3: Stress Testing (Weeks 5-6)**
1. Multiple concurrent claims
2. Pool capital depletion scenarios
3. High-frequency policy issuance
4. Edge case handling (expired policies, insufficient reserves)

### 6.2 Mainnet Pilot

**Phase 4: Limited Mainnet Launch (Months 2-3)**
1. Single insurance pool (XRP-denominated)
2. Whitelisted institutional participants only
3. Maximum $100K total coverage
4. Manual claim approval override available

**Phase 5: Public Launch (Month 4+)**
1. Multiple asset pools (XRP, RLUSD)
2. Open to all XRPL participants
3. Automated claim processing
4. Community governance for pool parameters

## 7. Reference Implementation

**Repository**: https://github.com/wflores9/ward-protocol

**SDK Components**:
```python
ward/
├── pool.py          # AMM pool management
├── policy.py        # NFT policy issuance
├── claims.py        # Claim processing engine
├── xls66.py         # XLS-66 monitoring integration
└── escrow.py        # Time-locked settlements
```

**Example Usage**:
```python
from ward import InsurancePool, Policy
from xrpl.clients import JsonRpcClient

client = JsonRpcClient("https://s.altnet.rippletest.net:51234")

# Create insurance pool
pool = InsurancePool(client, asset="XRP")
pool.initialize(initial_capital=100000)

# Issue policy
policy = Policy.create(
    insured_vault="vault://abc123",
    coverage=10000,
    term_days=90
)

# Monitor for claims
pool.monitor_xls66_events(callback=pool.process_claim)
```

## 8. Security Considerations

### 8.1 Smart Contract Risk

**Mitigation**: Ward Protocol uses only native XRPL transactions (no custom smart contracts). All logic resides in audited off-chain monitoring services.

### 8.2 Oracle Risk

**Risk**: Claim triggering depends on accurate XLS-66 state monitoring.

**Mitigation**:
- Multiple independent monitoring nodes
- Consensus mechanism for claim validation (3-of-5 nodes must agree)
- 48-hour Escrow delay enables dispute resolution

### 8.3 Capital Adequacy Risk

**Risk**: Pool insolvency if claims exceed reserves.

**Mitigation**:
- 200% minimum coverage ratio enforced
- Real-time reserve monitoring
- Automatic policy sales halt at 250% threshold
- LP capital calls at warning levels

### 8.4 Liquidation Front-Running

**Risk**: Malicious actors trigger false liquidations to collect insurance.

**Mitigation**:
- Claim validation against actual XLS-66 ledger state
- First-loss capital depletion verification required
- Multi-signature approval for suspicious large claims

### 8.5 Regulatory Compliance

**Consideration**: Insurance products may require licensing in certain jurisdictions.

**Approach**:
- Decentralized pool operation (no central insurance company)
- Permissionless participation (no KYC at protocol level)
- Individual participants responsible for jurisdictional compliance
- Pool governance can add permissioned domain integration (XLS-80) if needed

### 8.6 Key Management

**Risk**: Pool wallet compromise could drain all insurance capital.

**Mitigation**:
- Multi-signature requirements (3-of-5 institutional signers)
- Hardware wallet cold storage for reserves
- Hot wallet limited to 1% of pool capital
- Time-delayed withdrawals for large amounts

# Appendix

## Appendix A: FAQ

### A.1: How does Ward Protocol differ from traditional insurance?

Ward Protocol is a decentralized, peer-to-peer insurance pool. There is no central insurance company. Capital providers earn premium yield directly, and claims are settled automatically based on XRPL ledger state. Traditional insurance involves intermediaries, underwriting processes, and claim adjusters.

### A.2: What happens if the insurance pool runs out of capital?

Policies have maximum coverage limits based on available pool capital. The protocol enforces a 200% coverage ratio, meaning pools can only insure up to 50% of their capital. If reserves drop below this threshold, new policy sales automatically halt until capital is replenished.

### A.3: Can I trade my insurance policy?

Yes. Policies are XLS-20 NFTs and can be transferred or sold on secondary markets. This enables a liquid market for insurance positions.

### A.4: How are premiums calculated?

Premiums are risk-adjusted based on:
- XLS-66 vault health metrics
- Borrower creditworthiness (if available via XLS-70 credentials)
- Historical default rates
- Current pool reserve levels
- Coverage duration

Base rates range from 1-5% annually.

### A.5: Will Ward Protocol require a future amendment?

Not immediately. The ecosystem approach proves demand and validates the business model. If adoption reaches scale and protocol-level integration would significantly reduce costs or improve functionality, a future XLS-104 amendment may be proposed. Such an amendment would introduce native `InsurancePolicy` ledger objects and automated claim settlement.

### A.6: How does Ward Protocol make money?

Ward Protocol is a decentralized protocol, not a for-profit company. Value accrues to:
- **Liquidity Providers**: Earn premium yield (target 8-15% APY)
- **Protocol Developers**: Optional development fee (0.1% of premiums)
- **Governance Token Holders**: If future governance token is introduced

### A.7: What XLS-66 loans are eligible for insurance?

Currently:
- Fixed-term loans only (no revolving credit)
- Maximum 90-day term
- Minimum first-loss capital ratio of 5%
- Whitelisted LoanBroker addresses (pilot phase)

Future versions may support broader loan types.

### A.8: How long does claim settlement take?

48 hours minimum due to Escrow time-lock. This enables:
- Fraud detection
- Community review
- Dispute resolution

Large claims (> 10% of pool) require additional multi-sig approval.
