# Ward Protocol

[![Version](https://img.shields.io/badge/SDK-v0.2.6-gold)](https://pypi.org/project/ward-protocol/)
[![Tests](https://img.shields.io/badge/tests-559%20Python%20%C2%B7%2022%20Rust%20%C2%B7%2053%20TypeScript-brightgreen)](#running-tests)
[![CI](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml/badge.svg)](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml)
[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> **`ward_signed = False — always.`**
> Ward constructs unsigned transactions. Institutions sign. The chain settles.
> Ward is never a counterparty, never a custodian, never a signatory.

---

## Overview

Ward Protocol is deterministic default-resolution infrastructure for institutional tokenized credit. It gives lenders, vault operators, and capital partners a consistent way to validate defaults, prepare unsigned settlement packets, and export reviewable conformance receipts without handing signing authority to Ward.

On XRPL and across the live multi-chain testnet demo, Ward re-reads authoritative ledger state, applies the same nine evidence gates, and returns a deterministic result. No oracle, no discretionary operator step, and no Ward signature. The outcome stays inspectable for risk, compliance, engineering, and capital review. See real-world scenarios at [wardprotocol.org/use-cases](https://wardprotocol.org/use-cases).

---

## How It Works

Full specification at [wardprotocol.org/spec](https://wardprotocol.org/spec).

Nine deterministic on-ledger checks:

| Step | Check |
|------|-------|
| 1 | NFT existence + taxon 281 (XLS-20) |
| 2 | Policy validity — ledger `close_time` + matching on-chain premium payment |
| 3 | Vault address binding — NFT metadata vault == defaulted vault |
| 4 | `LSF_LOAN_DEFAULT` flag on `LedgerEntry(index=loan_id)` |
| 5 | Vault loss > 0 drops |
| 6 | Pool usable balance ≥ vault loss (balance − XRPL reserve) |
| 7 | Replay protection — NFT still live (burn-on-settlement) |
| 8 | Claimant holds NFT — `AccountNFTs(account=claimant)` |
| 9 | Pool solvency + rate limit (≤ 3/NFT/300 s, ratio ≥ 1.5×) |

---

## Live Status

| Metric | Value |
|--------|-------|
| SDK Version | v0.2.6 |
| Hosted API | api.wardprotocol.org — live |
| Python Tests | 559/559 passing (3.11 · 3.12 · 3.13) |
| Rust Tests | 22/22 passing |
| TypeScript Tests | 53/53 passing |
| Live Testnets | 8 live testnet rails in the multi-chain demo |
| Security | June 2026 institutional hardening complete |
| Altnet E2E | F·01–F·06 confirmed on-chain |
| XRPLF Standard | Discussion #474 — active |
| Swell 2026 | Application submitted |

---

## Quick Start

```python
pip install ward-protocol==0.2.6
```

```python
from ward import WardClient, ClaimValidator

client = WardClient("https://s.altnet.rippletest.net:51234/")
validator = ClaimValidator("https://s.altnet.rippletest.net:51234/")

# ... purchase coverage & validate claims (ward_signed remains False)
```

Full docs: [wardprotocol.org/docs](https://wardprotocol.org/docs)  
Interactive demo: [wardprotocol.org/demo](https://wardprotocol.org/demo)  
Institutional readiness: [docs/institutional-readiness.md](docs/institutional-readiness.md)

---

## XLS Standards

| Standard | Role in Ward |
|----------|-------------|
| XLS-66 | Lending vault + loan lifecycle — Ward resolves defaults |
| XLS-20 | Policy NFT (taxon 281, `TF_BURNABLE`, non-transferable) |
| XLS-70 | KYC/AML credential NFT (taxon 282) |
| XLS-80 | Domain verification for vault operators |

---

## Multi-Chain Status

**Live**

| Chain | Status | Notes |
|-------|--------|-------|
| XRPL Altnet | **Live** | F01–F06 E2E verified on Altnet; NFT policy and XLS-66-aligned validation path |

**In Development**

| Chain | Status | Notes |
|-------|--------|-------|
| Solana | **In development** | Devnet environment provisioned; SPL adapter in active development |

**Roadmap — scoped, environments provisioned**

| Chain | Environment | Notes |
|-------|-------------|-------|
| Flare | Coston2 | WardResolver contract surface scoped |
| XRPL EVM | Sidechain testnet | EVM-aligned policy contract surface scoped |
| XDC | Apothem | ERC policy contract surface scoped |
| Polygon | Amoy | ERC policy contract surface scoped |
| Stellar | Testnet | Soroban contract surface scoped |
| Algorand | Testnet | ASA policy surface scoped |

Engineering detail: [MULTICHAIN_GAPS.md](./MULTICHAIN_GAPS.md)

Integration plans: [docs/integration/](docs/integration/)

---

## Running Tests

```bash
# Python (559 tests)
pip install -r requirements.txt
python -m pytest test_ward.py -m "not integration" -v
python -m pytest sdk/python/tests/ -v

# Rust (22 tests)
cd ward && cargo test

# TypeScript (53 tests)
cd sdk/typescript && npm install && npm test

# Lint
ruff check ward/ --select=E,F,W,I --ignore=E501
```

---

## Community & Links

- **Discord:** [discord.gg/cGm9m5pEGK](https://discord.gg/cGm9m5pEGK)
- **Website:** [wardprotocol.org](https://wardprotocol.org)
- **GitHub:** [wflores9/ward-protocol](https://github.com/wflores9/ward-protocol)
- **XRPLF Discussion #474:** [github.com/XRPLF/XRPL-Standards/discussions/474](https://github.com/XRPLF/XRPL-Standards/discussions/474)
- **PyPI:** [pypi.org/project/ward-protocol](https://pypi.org/project/ward-protocol/)

---

## License

The Ward Protocol specification and SDK are MIT licensed.  
The hosted API at `api.wardprotocol.org` is subject to commercial terms.  
Ward Protocol is protocol software — not an insurance product, financial instrument, or regulated entity.

See [wardprotocol.org/terms](https://wardprotocol.org/terms)

---

`ward_signed = False — always.`
