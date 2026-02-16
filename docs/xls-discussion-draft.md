# XLS-103d: Institutional DeFi Insurance Protocol

**Category:** Ecosystem  
**Status:** Draft  
**Repository:** https://github.com/wflores9/ward-protocol  
**Specification:** [XLS-103d-specification.md](https://github.com/wflores9/ward-protocol/blob/main/docs/XLS-103d-specification.md)

---

## Abstract

Ward Protocol provides institutional-grade insurance coverage for vault depositors participating in the XLS-66 Lending Protocol. The protocol enables depositors to purchase insurance policies that protect against losses exceeding First-Loss Capital protection when borrowers default.

Ward Protocol operates as an ecosystem-level application using existing XRPL primitives (XLS-30 AMM pools, XLS-20 NFTs, Payment transactions, and Escrow) without requiring protocol amendments.

---

## Motivation

The XLS-66 Lending Protocol (deployed January 2026) enables fixed-term, fixed-rate loans using pooled liquidity from XLS-65 Single Asset Vaults. While XLS-66 includes First-Loss Capital protection, vault depositors face significant uninsured risks when defaults exceed this protection.

**The Uninsured Gap:**

When a loan defaults:
```
DefaultAmount = Principal + Interest
DefaultCovered = min(FirstLossCapital × LiquidationRate, DefaultAmount)
VaultLoss = DefaultAmount - DefaultCovered
```

**Example:**
- Loan defaults: $55,000
- First-Loss covers: $1,000
- **Depositors lose: $54,000**

This gap creates barriers for institutional participation:
1. Capital allocation restricted by regulatory requirements
2. Risk exposure beyond acceptable limits
3. No mechanism to transfer tail risk

---

## Solution: Ecosystem Insurance Layer

Ward Protocol solves this by providing insurance that makes depositors whole when defaults exceed first-loss protection.

**Key Design Decisions:**

### Why Ecosystem (Not Amendment)?
- **Rapid deployment:** Weeks, not months/years
- **Market validation:** Prove demand before protocol changes
- **Iteration speed:** Fix bugs without consensus
- **Future upgrade path:** Can propose XLS-104 if successful

### Primitives Used:
- **XLS-20 NFTs:** Policy certificates (transferable, metadata storage)
- **XLS-30 AMM:** Insurance pool capital aggregation
- **XLS-65 Vaults:** Monitor depositor losses
- **XLS-66 Loans:** Detect defaults, calculate losses
- **Escrow:** Time-locked claim settlements (48hr dispute window)

---

## Architecture Overview
```
Vault Depositor → Purchases Policy (XLS-20 NFT)
                ↓
         Premium Payment
                ↓
    Insurance Pool (XLS-30 AMM)
                ↓
    [Loan Defaults] → Ward Monitors XLS-66
                ↓
         Calculate Loss
                ↓
      Validate Claim (9 steps)
                ↓
    Escrow Settlement (48hr)
                ↓
     Payout to Depositor
```

**Monitoring Integration:**
- Real-time WebSocket subscription to `LoanManage` transactions
- Parse `tfLoanDefault` flag (0x00010000)
- Query `Vault.AssetsTotal` changes
- Calculate depositor loss from vault share value impact

---

## Technical Implementation

**Policy Issuance:**
```json
{
  "protocol": "ward-v1",
  "vault_id": "2DE64CA4...",
  "coverage_amount": "50000000000",
  "coverage_start": "2026-02-15T00:00:00Z",
  "coverage_end": "2026-05-15T00:00:00Z",
  "pool_id": "3F4A5B6C..."
}
```

**Claim Validation (9 Steps):**
1. Verify loan defaulted (`lsfLoanDefault` flag)
2. Calculate vault loss using XLS-66 formulas
3. Fetch policy from database
4. Verify policy is active
5. Check coverage window
6. Verify vault matches policy
7. Calculate payout (min of loss and coverage)
8. Check pool capital adequacy
9. Approve/reject and log

**Premium Calculation:**
```
premium = coverage × base_rate × term_factor × risk_multiplier

Where:
- base_rate: 1-5% annually (risk-tiered)
- risk_multiplier: 0.5x - 2.0x based on:
  * Vault utilization
  * First-loss coverage ratio
  * Impairment ratio (LossUnrealized)
  * Historical default rate
```

---

## Reference Implementation

**Repository:** https://github.com/wflores9/ward-protocol

**Components:**
- Python SDK for XLS-66/65 monitoring
- PostgreSQL database (policies, claims, events)
- Claim validation engine
- Policy NFT minting
- Risk-based premium calculator

**Testnet Status:** Ready for deployment

---

## Security Considerations

1. **Oracle Risk:** Multiple monitoring nodes with 3-of-5 consensus
2. **Capital Adequacy:** 200% minimum coverage ratio enforced
3. **Key Management:** Multi-sig (3-of-5), cold storage for reserves
4. **Claim Validation:** 48-hour escrow for dispute resolution
5. **No Smart Contracts:** Uses only native XRPL transactions

---

## Future Upgrade Path: XLS-104

If Ward Protocol achieves product-market fit, a future amendment could add:
- Native `InsurancePolicy` ledger object
- `PolicyClaim` transaction type
- Automated claim settlement hooks
- Lower operational costs

This ecosystem approach validates demand before proposing protocol changes.

---

## Discussion Questions

1. **Naming:** Is "XLS-103d" appropriate for ecosystem category? (d suffix vs standard numbering)
2. **Integration:** Are there other XRPL lending protocols we should design compatibility for?
3. **Primitives:** Would protocol-level insurance primitives be valuable for other use cases beyond lending?
4. **Testnet:** Should we coordinate with XLS-66 implementers for joint testnet demonstration?

---

## Community Feedback Requested

We welcome feedback on:
- Architecture design choices
- Security model
- Integration with XLS-66/65
- Premium calculation methodology
- Potential protocol-level features (XLS-104)

---

**Contact:**
- GitHub: [@wflores9](https://github.com/wflores9)
- Repository: https://github.com/wflores9/ward-protocol
- Email: wflores@wardprotocol.org

---

**Note:** This proposal intentionally starts as an ecosystem application to validate market demand and iterate quickly. We believe this approach serves the XRPL community better than immediately requesting protocol amendments.
