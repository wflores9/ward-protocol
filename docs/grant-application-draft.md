# XRPLF Grant Application — Ward Protocol

**Program:** XRPL Foundation Developer Grant  
**Applicant:** Ward Protocol  
**Date:** 2026-05-01  
**Requested Amount:** $80,000 USD (or XRP equivalent)  
**Grant Category:** Ecosystem Infrastructure / DeFi Safety  

---

## Executive Summary

Ward Protocol is an open-source, trustless default-protection layer for XLS-66 institutional lending vaults on the XRP Ledger. It enables any institution to purchase on-chain insurance against borrower defaults, verified deterministically from ledger state — without oracles, off-chain databases, or trusted intermediaries.

We are requesting $80,000 to fund a professional Code4rena security audit, a production-grade SDK expansion (Go, Rust CLI), and ecosystem developer grants for integrations with XLS-66 lending protocols.

---

## Problem Statement

The XRP Ledger's XLS-66 standard enables institutional lending vaults — but no standardized insurance or default-protection mechanism exists. When a borrower defaults on an XLS-66 vault, lenders have no deterministic, on-chain recourse:

1. **No trustless default insurance** — existing solutions rely on centralized underwriters or manual claims processes.
2. **No cross-protocol composability** — insurance primitives are not reusable across different XLS-66 lending protocols.
3. **No open standard** — each protocol implements ad-hoc risk management, creating fragmentation and audit burden.

This gap prevents institutional adoption of XRPL DeFi. Traditional financial institutions require:
- Audited, deterministic claim settlement
- No custodial key risk on the insurer side
- On-chain proof of default, not oracle attestation

---

## Solution: Ward Protocol

Ward Protocol is a protocol specification and open-source SDK that provides:

### 1. Trustless Default Detection (`VaultMonitor`)
- WebSocket subscription to the XRPL ledger stream
- Detects `LSF_LOAN_DEFAULT` flag changes in real time
- Requires 3-ledger confirmation before firing callbacks
- Reconnects automatically with exponential back-off
- 60-second heartbeat timeout prevents silent failures

### 2. 9-Step On-Chain Claim Validation (`ClaimValidator`)
All 9 steps read directly from the XRPL ledger:
1. NFT existence and taxon verification
2. Policy expiry (XRPL ledger close_time — no server clock)
3. Vault address binding
4. On-chain default flag verification
5. Positive vault loss
6. Pool coverage breach check
7. Replay protection
8. Claimant NFT ownership
9. Pool solvency and rate limiting

### 3. PREIMAGE-SHA-256 Escrow Settlement (`EscrowSettlement`)
- Claimant generates 32-byte random preimage locally
- Ward receives only `condition_hex` — never the preimage
- `ward_signed = False` invariant: Ward never holds signing keys
- EscrowCreate + EscrowFinish settled directly on XRPL

### 4. Pool Health Monitoring (`PoolHealthMonitor`)
- Coverage ratio enforcement (minimum 1.5× by default)
- XRPL reserve accounting (base + owner reserves)
- Real-time pool state via WebSocket ledger stream

### Core Invariant
```
ward_signed = False
```
Ward Protocol constructs unsigned transactions. Institutions sign; XRPL settles. Ward never holds, touches, or stores private keys. This is a runtime-enforced invariant, not merely a design goal.

---

## Technical Achievements (v0.2.2)

### Security Hardening
15 attack vectors identified and mitigated in v0.2.2:
- AV 2.1–2.15 (policy forgery, replay, clock manipulation, address injection, etc.)
- 146 tests covering all 15 attack vectors
- Thread-safe per-NFT sliding-window rate limiter
- TLS-only WebSocket URL allowlist
- Integer-drops enforcement (rejects float XRP amounts)

### Architecture
- Modular Python SDK: 11 modules, ~1,565 nSLOC
- Rust modules: VaultMonitor + EscrowBuilder, ~583 nSLOC
- Full async (asyncio + xrpl-py)
- 62% test coverage (100% on constants, 86% on primitives)

### Developer Experience
- Python starter examples (F·01–F·06): vault registration through escrow settlement
- Java examples (xrpl4j v6.0.0): F·01–F·03 with full invariant assertions
- TypeScript examples: 3 examples (vault registration, VaultMonitor, escrow)
- `.env.example` for all three languages
- Interactive conformance checklist UI (`checklist.html`)

---

## Grant Budget

| Item | Amount | Description |
|------|--------|-------------|
| Code4rena Security Audit | $45,000 | Professional smart contract / protocol audit (competitive audit contest) |
| Go SDK | $15,000 | Port Python SDK to Go for backend microservice integrations |
| Rust CLI (`ward-cli`) | $8,000 | Command-line tool: vault registration, claim validation, escrow settlement |
| Developer Ecosystem Grants | $8,000 | Grants for 3–5 XRPL projects integrating Ward Protocol |
| Documentation + Tutorials | $4,000 | Video walkthroughs, extended API docs, integration guides |
| **Total** | **$80,000** | |

---

## Milestones

### Milestone 1 — Code4rena Audit (Month 1–2)
- [ ] Submit contest on Code4rena
- [ ] Address all Critical and High severity findings
- [ ] Publish audit report
- [ ] Release v0.3.0 with all audit fixes
- **Deliverable:** Published audit report + v0.3.0 release

### Milestone 2 — Go SDK (Month 2–3)
- [ ] Port `ClaimValidator`, `VaultMonitor`, `EscrowSettlement` to Go
- [ ] Go module published to pkg.go.dev
- [ ] Integration tests against XRPL Testnet
- **Deliverable:** `ward-go` v1.0.0 on pkg.go.dev

### Milestone 3 — Rust CLI (Month 3–4)
- [ ] `ward-cli` binary: `vault register`, `claim validate`, `escrow settle`
- [ ] Homebrew + apt packages
- [ ] Docker image published
- **Deliverable:** `ward-cli` v1.0.0 on GitHub Releases + Docker Hub

### Milestone 4 — Ecosystem Integrations (Month 3–6)
- [ ] 3–5 XRPL projects receive developer grants
- [ ] Minimum 1 production integration on XRPL Mainnet
- [ ] Public integration showcase page
- **Deliverable:** Showcase page with ≥1 mainnet integration

### Milestone 5 — Documentation (Month 4–6)
- [ ] Video walkthrough: vault registration to escrow settlement
- [ ] Extended API reference (OpenAPI 3.1)
- [ ] Integration guide for XLS-66 protocol developers
- **Deliverable:** Updated docs.ward-protocol.xyz

---

## XRPL Ecosystem Impact

### Why XRPL?
Ward Protocol is built specifically for XRPL's XLS-66 lending standard. It is not portable to EVM chains without significant redesign — the escrow mechanism relies on XRPL-native crypto-conditions, NFToken ownership, and ledger time semantics.

### Institutional DeFi Enablement
Ward Protocol addresses a direct blocker for institutional DeFi adoption on XRPL:
- Provides the insurance primitives that compliance-sensitive institutions require
- Eliminates custodial key risk (ward_signed = False)
- Creates an audited, open standard that any XLS-66 protocol can integrate

### Composability
Ward Protocol is designed as infrastructure, not a product:
- Open-source (MIT license)
- No protocol-specific assumptions beyond XLS-66 + XLS-20
- Composable with XLS-70 (credentials) and XLS-80 (permissioned domains)

### Developer Ecosystem
The ecosystem grant component directly funds XRPL developer adoption:
- Reduce integration friction for XLS-66 protocol teams
- Create a flywheel effect: more integrations → larger insurance pools → more institutional TVL

---

## Team

**Lead Developer:** W. Flores (@wflores9)
- Full-stack XRPL developer
- Author of Ward Protocol specification and SDK
- Experience with XLS-20, XLS-66, XLS-70 standards

**Advisors:** [To be confirmed]

---

## Current Status

- **SDK version:** v0.2.2 (modular, security-hardened)
- **Test suite:** 296/296 Python · 40/40 Rust · 45/45 TypeScript passing
- **Languages:** Python (production), Rust (secondary), TypeScript, Java (starters)
- **Testnet:** Live demos on XRPL Altnet
- **Website:** [ward-protocol.xyz](https://ward-protocol.xyz)

---

## Why Now?

1. **XLS-66 is gaining traction** — Multiple teams are building institutional lending vaults on XRPL. The insurance infrastructure needs to exist before they reach mainnet.

2. **Code4rena audit window** — A professional audit now, before significant TVL, is far more cost-effective than a post-incident audit.

3. **Standards moment** — The XRPLF is actively supporting DeFi infrastructure. Ward Protocol is positioned to become the default standard for XLS-66 default protection.

---

## Supporting Materials

- **Specification:** `docs/institutional-defi-insurance-specification.md`
- **Code4rena scope:** `docs/code4rena-scope.md`
- **Security notes:** `security_notes.md`
- **Architecture:** `INFRASTRUCTURE.md`
- **Changelog:** `CHANGELOG.md`
- **Testnet proof:** `testnet_proof.md`

---

*Ward Protocol is open-source under the MIT License. ward_signed = false.*
