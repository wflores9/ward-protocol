# Ward Protocol

[![Website](https://img.shields.io/badge/website-wardprotocol.org-blue)](https://wardprotocol.org)
[![SDK](https://img.shields.io/badge/SDK-v0.2.2-green)](#sdk-changelog)
[![Tests](https://img.shields.io/badge/tests-146%2F146-brightgreen)](#running-tests)
[![XRPL](https://img.shields.io/badge/XRPL-XLS--66%20%C2%B7%20XLS--70%20%C2%B7%20XLS--20-orange)](https://github.com/XRPLF/XRPL-Standards)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

---

**Deterministic Default Resolution for On-Chain Credit Systems**

---

## Overview

Ward Protocol defines deterministic default resolution for lending systems
on the XRP Ledger.

XLS‑66 introduces native lending primitives:
- loans can be created
- repayment can be tracked
- defaults can occur

However, XLS‑66 does not define a canonical, deterministic model for what
happens when obligations fail.

Ward Protocol defines that missing behavior.

---

## The Problem

Lending systems define how credit is created.

Few define how failure is resolved.

On XRPL:
- loan origination is standardized (XLS‑66)
- default can be triggered
- resolution is not deterministic or protocol-defined

This results in:
- inconsistent outcomes
- implementation-dependent risk
- non-composable systems

At scale, undefined failure behavior becomes a systemic constraint.

---

## What Ward Defines

Ward Protocol is an open specification.

It defines:
- how default is validated using XRPL ledger state
- how claims are verified deterministically
- how settlement is constructed using native XRPL primitives

Ward does not:
- hold keys
- custody funds
- act as an insurer

Ward defines behavior. The XRP Ledger enforces it.

---

## Core Invariant

```
ward_signed = false
```

Ward constructs unsigned transactions.

Institutions sign.
XRPL executes and finalizes.

Ward is never a counterparty.

---

## Design Principles

- **Deterministic**
  No discretionary execution. Same input → same outcome.

- **On-Ledger**
  All validation is derived from XRPL ledger state.

- **Non-Custodial**
  Ward does not hold keys or funds.

- **Composable**
  Protocol-level logic shared across implementations.

---

## Why Now

Tokenized credit is scaling across XRPL and other systems.

As capital scales:
- defaults become inevitable
- resolution becomes critical

Without deterministic default handling:
- risk is not measurable
- behavior is not standardized
- systems cannot scale institutionally

Ward addresses this at the protocol layer.

---

## Protocol Flow

Ward defines a deterministic execution sequence:

1. Vault Registration
2. Policy Issuance (XLS‑20 NFT, taxon 281)
3. Default Detection (health_ratio < 1.5 across 3 consecutive ledger closes)
4. Claim Validation (9-step on-ledger verification)
5. Escrow Construction (PREIMAGE-SHA-256, unsigned)
6. Settlement Execution on XRPL (institution signs, XRPL finalizes)

---

## 9-Step Claim Validation

`ward_validate_claim(vault, borrower, token_id, ledger_state)`

1. Vault exists on ledger
2. Policy NFT exists (taxon=281, tfBurnable, NOT tfTransferable)
3. NFT ownership valid
4. NFT not burned
5. Policy not expired (XRPL ledger time — not server clock)
6. Default confirmed × 3 ledger closes
7. No active escrow pending
8. No duplicate claim
9. KYC + domain credentials valid (XLS-70, XLS-80)

Output: `VALID / INVALID` + deterministic unsigned EscrowCreate

---

## Implementation Status

- ✅ SDK built and tested — 146/146 tests passing
- ✅ 15/15 Rust tests passing
- ✅ v0.2.2 modular architecture — 8 Python modules + 2 Rust modules
- ✅ Testnet simulation confirmed — 5 on-chain transactions (Altnet)
- ✅ XRPLF Discussion #474 — active
- ✅ Security review complete — all findings resolved
- ✅ ruff clean — CI green across Python 3.10 / 3.11 / 3.12

In progress:

- ☐ XRPLF grant application
- ☐ Security audit — Code4rena public contest
- ☐ Legal opinion — classification as protocol software
- ☐ Legal structure (in progress)

---

## Repository Structure

```
ward-protocol/
├── ward/
│   ├── __init__.py
│   ├── constants.py
│   ├── primitives.py
│   ├── client.py
│   ├── vault_monitor.py
│   ├── validator.py
│   ├── settlement.py
│   ├── pool.py
│   ├── chain_reader.py
│   ├── security.py
│   └── tx_builder.py
├── ward/src/
│   ├── monitor.rs
│   └── escrow.rs
├── starter/
│   ├── python/
│   ├── typescript/
│   └── java/
├── test_ward.py
├── security_notes.md
├── REFACTOR.md
└── docs/
```

---

## Roadmap

### Phase 1 — Protocol Specification (Now → Q2 2026)

- SDK built and verified
- Testnet execution confirmed
- Specification refinement
- Security hardening

### Phase 2 — First Institutional Partner (Q2–Q3 2026)

- Ward Certified program launch
- First institutional vault certified
- First mainnet deployment

### Phase 3 — Open Standard (Q4 2026+)

- XRPLF Standards submission
- Multi-institution pool support
- Cross-chain compatibility exploration

---

## Ward Certified

Ward Certified indicates that a vault conforms to the Ward deterministic
default handling model.

This is a technical conformance designation — not a financial guarantee.

See [wardprotocol.org/certified](https://wardprotocol.org/certified) for
the public registry.

---

## Positioning

XLS‑66 defines:
- loan origination
- repayment lifecycle
- default state

Ward defines:
- deterministic resolution of that state

**Ward defines canonical default behavior for XRPL lending.**

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

The Ward specification is open.

Institutions and developers are encouraged to:
- implement
- extend
- propose improvements via XRPLF Discussion #474

---

## Running Tests

```bash
# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov

# Run unit tests
py -m pytest test_ward.py -m "not integration"

# Run Rust tests
cargo test

# Lint
ruff check ward/
```

---

## SDK Changelog

See [CHANGELOG.md](CHANGELOG.md)

Current: v0.2.2 — 146/146 Python tests · 15/15 Rust tests · ruff clean

---

## License

MIT License

Ward Protocol is a software specification.

It is not:

- an insurance product
- a financial instrument
- a regulated entity

See [wardprotocol.org](https://wardprotocol.org) · [Terms](https://wardprotocol.org/terms)
