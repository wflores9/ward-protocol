# Ward Protocol

**The open specification for XLS-66 vault default protection on the XRP Ledger.**

[![Website](https://img.shields.io/badge/website-wardprotocol.org-blue)](https://www.wardprotocol.org)
[![SDK Version](https://img.shields.io/badge/SDK-v0.2.2-green)](#sdk-changelog)
[![Tests](https://img.shields.io/badge/tests-95%2F95-brightgreen)](#running-tests)
[![XRPL Standards](https://img.shields.io/badge/XRPL-XLS--66%20%C2%B7%20XLS--70%20%C2%B7%20XLS--20-orange)](https://github.com/XRPLF/XRPL-Standards)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

[Website](https://www.wardprotocol.org) · [Dashboard](https://www.wardprotocol.org/dashboard.html) · [API Docs](https://www.wardprotocol.org/api.html) · [XRPLF Discussion #474](https://github.com/XRPLF/XRPL-Standards/discussions/474)

---

## The Problem Ward Solves

Institutional DeFi vaults on the XRP Ledger have no default protection layer.

XLS-66 vaults can hold regulated RWAs, tokenized credit, and institutional capital — but when a borrower defaults, there is no standardized mechanism for detecting that default, settling a claim, and compensating depositors. Every institution builds this from scratch, or doesn't build it at all.

**Ward Protocol is that missing layer.**

---

## What Ward Protocol Is

Ward Protocol is a **software specification** — not an insurance company, not an operator, not a service.

Ward defines the open standard for default protection on XLS-66 vaults. Institutions that want to offer coverage to vault depositors implement Ward's specification using their own wallets, their own capital, and their own regulatory licenses.

Ward writes unsigned XRPL transactions. The institution signs them. The XRP Ledger enforces the outcome. Ward's server is irrelevant once a transaction is on-chain.

---

## The Core Invariant

```python
# Ward NEVER does this:
await submit_and_wait(tx, client, ward_wallet)  # Ward has no wallet

# Ward ALWAYS does this:
return UnsignedTransaction(tx_dict=tx.to_dict(), ward_signed=False)
# Institution signs and submits with their own wallet
```

This invariant is enforced at the architecture level across every module. No Ward class stores a wallet. No Ward method signs a transaction.

---

## Current Status

| Metric | Value |
|---|---|
| **SDK Version** | 0.2.2 |
| **Unit Tests** | 106/106 passing |
| **On-Chain Transactions Confirmed** | 5 (XRPL Altnet) |
| **External Service Dependencies** | 0 — pure XRPL |
| **Ward Holds Keys** | Never |
| **Authoritative State Location** | XRPL Ledger |
| **XRPLF Standards** | XLS-66 · XLS-70 · XLS-80 · XLS-20 |

### Confirmed On-Chain Transactions

| Step | Type | Hash |
|---|---|---|
| 1 — Premium Payment | Payment | `D541B6A2...783169` |
| 2 — Policy NFT Mint | NFTokenMint | `B323815A...148CDF` |
| 3 — Escrow Create | EscrowCreate | `9BB570DB...B0A3` |
| 4 — Escrow Finish | EscrowFinish | `A4C2E1F9...C7D2` |
| 5 — NFT Burn | NFTokenBurn | `F18B3E2A...9F4E` |

---

## How It Works

```
Institution integrates Ward SDK
         │
         ▼
Ward builds unsigned tx ──► Institution signs ──► XRPL settles
         │                         │                    │
   (Ward stops here)        (Institution's wallet)  (Automatic)
```

1. **Setup** — Institution calls `WardClient.purchase_coverage()`. Ward returns a signed NFTokenMint (minted with the institution's wallet). Policy is on-chain.
2. **Monitoring** — `VaultMonitor` runs in institution's infrastructure over WebSocket. On default detection (health ratio < 1.5×, confirmed over 3 ledger closes), event fires.
3. **Settlement** — `EscrowSettlement` builds a PREIMAGE-SHA-256 conditioned escrow. Institution signs. Claimant finishes with the preimage. Policy NFT burns atomically.

---

## SDK Architecture (v0.2.2)

The v0.1.x monolith (`ward_client.py`, ~2,000 lines) has been fully refactored into a modular `ward/` package. Each module has a single responsibility and applies all relevant fixes from the v0.2.x hardening pass.

### Package Structure

```
ward/
├── __init__.py        v0.2.2 — full public API, complete __all__
├── constants.py       Single source of truth for all constants + LicenseTier
├── primitives.py      Errors, validators, crypto helpers, retry logic
├── client.py          Module 1 — WardClient  (purchase_coverage, burn_policy)
├── vault_monitor.py   Module 2 — VaultMonitor  (WebSocket, reconnect loop)
├── validator.py       Module 3 — ClaimValidator  (9-step adversarial validation)
├── settlement.py      Module 4 — EscrowSettlement  (PREIMAGE-SHA-256 flow)
├── pool.py            Module 5 — PoolHealthMonitor  (on-chain solvency + pricing)
├── chain_reader.py    Read-only XRPL helpers
└── tx_builder.py      Unsigned transaction construction

ward_client.py         Deprecated shim → re-exports from ward.* (removed v0.3.0)
test_ward.py           95-test suite, fully migrated to ward.* imports
```

### Module Responsibilities

| Module | Class | Fixes Applied |
|---|---|---|
| `ward/constants.py` | `LicenseTier`, `TIER_MINT_GATES` | #1 extraction |
| `ward/primitives.py` | `ValidationError`, `LedgerError`, `submit_with_retry` | #4 #6 #7 |
| `ward/client.py` | `WardClient` | #1 #2 #3 #6 #7 |
| `ward/vault_monitor.py` | `VaultMonitor`, `VerifiedDefault` | #1 #3 #5 |
| `ward/validator.py` | `ClaimValidator`, `ValidationResult` | #1 #3 #7 |
| `ward/settlement.py` | `EscrowSettlement`, `EscrowRecord` | #1 #2 #3 #6 |
| `ward/pool.py` | `PoolHealthMonitor`, `PoolHealth` | #1 #3 #7 |

---

## v0.2.x Code Hardening — 7 Fixes

The v0.2.x pass applied seven targeted fixes across the entire SDK:

| # | Fix | Detail |
|---|---|---|
| #1 | **Modular split** | Extracted `ward_client.py` monolith into 7 focused modules |
| #2 | **Typed wallet** | All `wallet` parameters typed as `xrpl.wallet.Wallet` and validated at boundary via `validate_wallet()` |
| #3 | **Context manager client** | `AsyncJsonRpcClient` used as `async with` — no leaked connections |
| #4 | **Client lifecycle** | No long-lived `AsyncJsonRpcClient` stored as instance attribute |
| #5 | **WebSocket reconnect** | `VaultMonitor` has exponential-backoff reconnect loop |
| #6 | **Retry logic** | All submissions via `submit_with_retry` (handles `telINSUF_FEE_P`, `terRETRY`, `terQUEUED`, `terPRE_SEQ`) |
| #7 | **Trust boundary** | `active_coverage_drops` derived on-chain from `AccountNFTs` — never caller-supplied; owner reserve = base + OwnerCount × 2 XRP |

---

## 3-Tier Licensing (mirrors index.html)

Ward Protocol offers three licensing tiers. The tier system is enforced on-chain — each policy NFT's URI metadata encodes the issuing tier, and `PoolHealthMonitor.is_minting_allowed()` gates minting at the correct risk level.

| Tier | Access | Pool Risk Gate |
|---|---|---|
| **Starter** | Open SDK, self-serve, email support | safest / safe / moderate only |
| **Standard** | Hosted Enterprise API, onboarding engineer | + elevated |
| **Enterprise** | White-label, 99.9% SLA, legal opinion included | + elevated (high always blocks all tiers) |

```python
from ward.constants import LicenseTier
from ward.pool import PoolHealthMonitor

monitor = PoolHealthMonitor(pool_address="rPoolXXX...")
health  = await monitor.get_health()   # fully on-chain — no args

# Tier-gated minting check
if monitor.is_minting_allowed(health, LicenseTier.STARTER):
    # proceed — pool is in "safest", "safe", or "moderate" tier
    ...
```

---

## Security Model

| Invariant | Enforcement |
|---|---|
| Ward never holds wallet keys | Architecture — no wallet stored anywhere in ward.* |
| Policies non-transferable | `tfBurnable` only (0x1) — XRPL enforces |
| URI ≤ 512 bytes | Asserted before every network call |
| All drops arithmetic integer | No float XRP math anywhere |
| XRPL ledger time for expiry | Never `time.time()` — always ledger `close_time` |
| `active_coverage_drops` on-chain | Summed from `AccountNFTs` — not a parameter |
| Owner reserve correct | `base_reserve + (OwnerCount × 2 XRP)` — not flat 20 XRP |
| 15 attack vectors covered | See `security_notes.md` for full adversarial analysis |

---

## Installation

```bash
pip install ward-protocol
```

Or from source:

```bash
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol
pip install -e ".[dev]"
```

---

## Quick Start

```python
from ward import WardClient

client = WardClient(xrpl_url="https://s.altnet.rippletest.net:51234/")

result = await client.purchase_coverage(
    wallet=institution_wallet,       # xrpl.wallet.Wallet — Ward never stores this
    vault_address="rVaultXXX...",
    coverage_drops=10_000_000,       # 10 XRP coverage, integer drops only
    period_days=90,
    pool_address="rPoolXXX...",
)
# result["nft_token_id"] — 64-char hex, on-chain forever
```

### Vault Monitor

```python
from ward import VaultMonitor

monitor = VaultMonitor(
    websocket_url="wss://s.altnet.rippletest.net:51233/",
    vault_addresses=["rVaultXXX..."],
)

@monitor.on_verified_default
async def handle_default(event):
    # Fires only after 3-ledger confirmation
    print(f"Default confirmed: {event.vault_address}")

await monitor.run()   # automatic reconnect on disconnect
```

### Claim Validation

```python
from ward import ClaimValidator

validator = ClaimValidator()
result = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="AABBCCDD..." * 8,      # 64-char hex
    defaulted_vault="rVaultXXX...",
    loan_id="EEFF0011..." * 8,
    pool_address="rPoolXXX...",
)

if result.approved:
    print(f"Claim valid — {result.steps_passed}/9 steps passed")
else:
    print(f"Rejected: {result.rejection_reason}")
```

### Pool Health

```python
from ward import PoolHealthMonitor

monitor = PoolHealthMonitor(pool_address="rPoolXXX...")
health  = await monitor.get_health()   # all data from XRPL — no off-chain args

print(f"Solvent: {health.is_solvent}")
print(f"Coverage ratio: {health.coverage_ratio:.2f}x")
print(f"Risk tier: {health.risk_tier}")
print(f"Annual premium rate: {health.dynamic_premium_rate:.2%}")

premium = monitor.calculate_premium(health, coverage_drops=1_000_000, period_days=30)
print(f"30-day premium: {premium['premium_drops']} drops")
```

### Escrow Settlement

```python
from ward import EscrowSettlement
from ward.primitives import generate_claim_preimage, make_preimage_condition

# Pool operator creates the escrow
preimage            = generate_claim_preimage()   # claimant holds this secret
condition, _        = make_preimage_condition(preimage)

settlement = EscrowSettlement()
record = await settlement.create_claim_escrow(
    pool_wallet=pool_wallet,
    claimant_address="rClaimantXXX...",
    payout_drops=500_000,
    condition_hex=condition,
    claim_id="claim-xyz",
    nft_token_id="AABBCCDD..." * 8,
)

# Claimant finishes (48-hour dispute window)
_, fulfillment = make_preimage_condition(preimage)
await settlement.finish_escrow(
    pool_wallet=pool_wallet,
    escrow_record=record,
    fulfillment_hex=fulfillment,
)
```

---

## Running Tests

```bash
# Unit tests only (no XRPL network needed)
pytest test_ward.py -v -m "not integration"

# All tests including testnet integration
pytest test_ward.py -v

# With coverage
pytest test_ward.py --cov=ward --cov-report=term-missing -m "not integration"
```

The test suite (`test_ward.py`) covers:

- **Security utilities** — address validation, drops validation, NFT ID validation
- **Cryptography** — PREIMAGE-SHA-256 condition/fulfillment round-trip
- **Adversarial validation** — 6 attack scenarios (fake NFT, expired policy, wrong vault, non-defaulted loan, drained pool, wrong taxon)
- **Pool solvency** — coverage ratio, premium pricing, tier gating
- **Escrow settlement** — dispute window enforcement, cancel window enforcement
- **KYC helpers** — hash determinism, type validation
- **Integration** — live testnet purchase (requires `WARD_POOL_ADDRESS` env var)

---

## SDK Changelog

### v0.2.2 (current)
- Added `ripple_time_now`, `get_ledger_close_time` to public `ward` namespace
- Full `__all__` with all constants aligned to `ward_client.py` shim

### v0.2.1
- Added `ClaimValidator`, `ValidationResult`, `EscrowSettlement`, `EscrowRecord` exports

### v0.2.0
- Initial modular split from `ward_client.py` monolith into `ward/` package
- Applied fixes #1–#7 across all 5 modules
- Integrated 3-tier licensing gates (Starter / Standard / Enterprise)

### v0.1.1
- Monolithic `ward_client.py` — single-file SDK
- 106/106 unit tests passing

---

## Repository Structure

```
ward-protocol/
├── ward/                    # SDK package (v0.2.2 modular)
│   ├── __init__.py          # Public API — from ward import ...
│   ├── constants.py         # All constants, LicenseTier, TIER_MINT_GATES
│   ├── primitives.py        # Errors, validators, crypto, retry
│   ├── client.py            # WardClient (Module 1)
│   ├── vault_monitor.py     # VaultMonitor (Module 2)
│   ├── validator.py         # ClaimValidator (Module 3)
│   ├── settlement.py        # EscrowSettlement (Module 4)
│   ├── pool.py              # PoolHealthMonitor (Module 5)
│   ├── chain_reader.py      # Read-only XRPL queries
│   └── tx_builder.py        # Unsigned transaction construction
├── ward_client.py           # Deprecated shim (removed v0.3.0)
├── test_ward.py             # 95-test suite (ward.* imports, AsyncMock-clean)
├── security_notes.md        # 15 attack vectors and mitigations
├── REFACTOR.md              # Architecture history and decisions
├── demo/                    # XRPLF grant demo
├── sdk/python/              # Standalone SDK distribution
└── docs/                    # Specification documents
```

---

## Roadmap

### Phase 1 — Protocol Specification (Now → Q2 2026)
- [x] SDK built and tested — 106/106 tests
- [x] v0.2.x modular refactor — 7 hardening fixes, 3-tier licensing
- [x] Testnet simulation confirmed — 5 on-chain transactions
- [x] XRPLF Discussion #474 — active community engagement
- [x] Ward Protocol LLC — Wyoming filing
- [ ] XRPLF Grant application
- [ ] Security audit — Code4rena public contest
- [ ] Legal opinion — Ward is a software protocol, not an insurer

### Phase 2 — First Institutional Partner (Q2–Q3 2026)
- [ ] White-label licensing agreement
- [ ] Institution brings capital + regulatory licenses
- [ ] Ward provides the on-chain rails
- [ ] First mainnet deployment with institutional capital

### Phase 3 — Open Standard (Q4 2026+)
- [ ] XRPLF Standards submission
- [ ] Multi-institution pool support
- [ ] Cross-chain bridge (XRPL EVM sidechain)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The Ward specification is open. Institutions are encouraged to implement, extend, and propose improvements.

---

## License

MIT — See [LICENSE](LICENSE).

Ward Protocol is a software specification. It is not an insurance product, financial instrument, or regulated service. Institutions that implement Ward bear full responsibility for compliance with applicable laws in their jurisdictions.
