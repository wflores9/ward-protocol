# Ward Protocol
[![Version](https://img.shields.io/badge/SDK-v0.2.6-gold)](https://pypi.org/project/ward-protocol/)
[![Tests](https://img.shields.io/badge/tests-436%20Python%20%C2%B7%2040%20Rust%20%C2%B7%2053%20TypeScript-brightgreen)](#running-tests)
[![CI](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml/badge.svg)](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml)
[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> **`ward_signed = False — always.`**  
> Ward constructs unsigned transactions. Institutions sign. XRPL (and other chains) settle.  
> Ward is never a counterparty, never a custodian, never a signatory.

---

## Overview

Ward Protocol is the open specification for **deterministic default resolution** for on-chain lending and tokenized assets. 

When a borrower defaults, nine on-ledger checks run automatically against live ledger state — **no oracle, no human judgment, no Ward signature**. The outcome is deterministic and verifiable every time.

**Live on 8 testnets** with full security hardening completed (v0.2.6).

---

## How It Works

Full specification at [wardprotocol.org/spec](https://wardprotocol.org/spec).

**Nine deterministic on-ledger checks**:

| Step | Check |
|------|-------|
| 1 | Policy NFT existence + correct taxon |
| 2 | Policy validity & premium payment |
| 3 | Vault address binding |
| 4 | Default flag on loan object |
| 5 | Actual vault loss > 0 |
| 6 | Pool has sufficient capital |
| 7 | Replay protection (NFT status) |
| 8 | Claimant holds valid NFT |
| 9 | Pool solvency + rate limit |

---

## Live Status (v0.2.6)

| Metric | Value |
|--------|-------|
| SDK Version | **v0.2.6** |
| Testnets Live | **8 chains** (XRPL Altnet primary + Stellar, Solana, Hedera, XDC, Algorand, Polygon, XRPL EVM) |
| Python Tests | 436 / 436 passing |
| Rust Tests | 40 / 40 passing |
| TypeScript Tests | 53 / 53 passing |
| Security | Full institutional audit remediation complete |
| Hosted API | [api.wardprotocol.org](https://api.wardprotocol.org) — live |

---

## Quick Start

```bash
pip install ward-protocol==0.2.6
```

```python
from ward import WardClient, ClaimValidator

client = WardClient("https://s.altnet.rippletest.net:51234/")
validator = ClaimValidator("https://s.altnet.rippletest.net:51234/")

# ... purchase coverage & validate claims (ward_signed remains False)
```

Full docs: [wardprotocol.org/docs](https://wardprotocol.org/docs)  
Interactive Demo: [wardprotocol.org/demo](https://wardprotocol.org/demo)

---

## Multi-Chain Support

| Chain | Status | Notes |
|-------|--------|-------|
| XRPL | **Live** | Primary, Altnet E2E |
| Stellar | Live | Testnet |
| Solana | Live | Devnet |
| Hedera | Live | Testnet |
| XDC | Live | Apothem |
| Algorand | Live | Testnet |
| Polygon | Live | Amoy |
| XRPL EVM | Live | Sidechain |

---

## Community & Links

- **Discord**: High-signal builder & institutional space → [Join here](https://discord.gg/cGm9m5pEGK)
- **Website**: [wardprotocol.org](https://wardprotocol.org)
- **GitHub**: [wflores9/ward-protocol](https://github.com/wflores9/ward-protocol)
- **XRPLF Discussion**: [#474](https://github.com/XRPLF/XRPL-Standards/discussions/474)

---

**`ward_signed = False — always.`**

---
