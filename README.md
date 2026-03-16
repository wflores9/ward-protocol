# Ward Protocol

**The open specification for XLS-66 vault default protection on the XRP Ledger.**

[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests: 95/95](https://img.shields.io/badge/tests-95%2F95-brightgreen)](tests/)
[![XRPL: Discussion](https://img.shields.io/badge/XRPL-Discussion%20%23474-blue)](https://github.com/XRPLF/XRPL-Standards/discussions/474)

[Website](https://wardprotocol.org) · [API Docs](https://api.wardprotocol.org) · [PyPI](https://pypi.org/project/ward-protocol/) · [XRPLF Discussion #474](https://github.com/XRPLF/XRPL-Standards/discussions/474)

---

## The Problem Ward Solves

Institutional DeFi vaults on the XRP Ledger have no default protection layer.

XLS-66 vaults can hold regulated RWAs, tokenized credit, and institutional
capital — but when a borrower defaults, there is no standardized mechanism
for detecting that default, settling a claim, and compensating depositors.
Every institution builds this from scratch, or doesn't build it at all.

Ward Protocol is that missing layer.

---

## What Ward Protocol Is

Ward Protocol is a **software specification** — not an insurance company,
not an operator, not a service.

Ward defines the open standard for default protection on XLS-66 vaults.
Institutions that want to offer coverage to vault depositors implement
Ward's specification using their own wallets, their own capital, and their
own regulatory licenses.

**Ward writes the rules. Institutions run the rails. Everything settles on XRPL.**

This is the same model as Stripe for payments — Stripe doesn't hold your
money, they define the protocol that moves it. Ward doesn't hold depositor
funds; it defines the protocol that protects them.

---

## Why This Architecture Matters

The institutional DeFi stack has settlement infrastructure, identity, and
liquidity. It does not have a default protection specification that
institutional partners can implement without taking on regulatory exposure.

Ward fills that gap. The acquisition pitch is not "buy our insurance company."
It is:

> *"Buy the risk management specification layer that makes your institutional
> DeFi stack complete."*

That argument requires three things Ward is building toward:

- **Embedded** — vault operators integrated deeply enough that removal is painful
- **Audited** — on-chain claims history that cannot be reproduced overnight
- **Clean legal structure** — written opinion that Ward is a software protocol, not an insurer

All three depend on the code never signing a transaction. See [REFACTOR.md](REFACTOR.md).

---

## The Core Invariant

```python
# Ward NEVER does this:
await submit_and_wait(tx, client, ward_wallet)  # Ward has no wallet

# Ward ALWAYS does this:
return UnsignedTransaction(tx_dict=tx.to_dict(), ward_signed=False)
# Institution signs and submits with their own wallet
```

Ward constructs unsigned XRPL transactions. Institutions sign them.
The XRP Ledger enforces the outcome. Ward's server is irrelevant once
a transaction is on-chain.

---

## Current Status

| Metric | Value |
|---|---|
| SDK Version | 0.1.1 |
| Unit Tests | 95/95 passing |
| On-Chain Transactions Confirmed | 5 (XRPL Altnet) |
| External Service Dependencies | 0 — pure XRPL |
| Ward Holds Keys | Never |
| Authoritative State Location | XRPL Ledger |
| XRPLF Standards | XLS-66 · XLS-70 · XLS-80 · XLS-20 |

---

## Confirmed On-Chain Transactions

| Step | Type | Hash |
|---|---|---|
| 1 — Premium Payment | Payment | D541B6A2...783169 |
| 2 — Policy NFT Mint | NFTokenMint | B323815A...148CDF |
| 3 — Escrow Create | EscrowCreate | 9BB570DB...B0A3 |
| 4 — Escrow Finish | EscrowFinish | E65C35A5...A3DBB |
| 5 — Policy NFT Burn | NFTokenBurn | A5A0652C...464D8 |

See [testnet_proof.md](testnet_proof.md) for full transaction hashes,
NFT token IDs, balance changes, and the one bug discovered and resolved
during the testnet run.

---

## Protocol Stack

| Standard | Role | Ward's Contribution |
|---|---|---|
| XLS-80 | Permissioned Domains | Compliant domain configuration for institutional vault access |
| XLS-70 | On-Chain Credentials | Credential schema for KYC/AML-gated participation |
| XLS-66 | Lending Vaults | Monitoring spec and default detection threshold (health ratio < 1.5) |
| XLS-20 | NFT Policies | Policy metadata schema (taxon=282, tfBurnable, no tfTransferable) |
| XRPL Escrow | Settlement | PREIMAGE-SHA-256 condition structure for claim settlement |

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

**Setup** — Institution calls `TxBuilder.register_vault()`. Ward returns
an unsigned `AccountSet`. Institution signs and submits. Vault appears
in XLS-80 domain registry on XRPL.

**Coverage** — Institution calls `TxBuilder.mint_policy_nft()`. Ward
returns an unsigned `NFTokenMint`. Institution mints — it's their
certificate, not Ward's.

**Default & Settlement** — `WardMonitor` runs in institution's
infrastructure. On default detection (health ratio < 1.5, confirmed
over 3 ledger closes), Ward builds unsigned `EscrowCreate`. Institution
signs. XRPL locks funds 48 hours. Claimant finishes with
PREIMAGE-SHA-256. NFT burns atomically.

---

## SDK

```bash
pip install ward-protocol
```

### Five Hardened Modules

| # | Class | Purpose |
|---|---|---|
| 1 | WardClient | Policy purchase — premium payment + NFT mint |
| 2 | VaultMonitor | WebSocket default detection, 3-ledger confirmation |
| 3 | ClaimValidator | 9-step adversarial-hardened on-chain validation |
| 4 | EscrowSettlement | PREIMAGE-SHA-256 conditioned claim settlement |
| 5 | PoolHealthMonitor | On-chain solvency and dynamic premium pricing |

### Quick Start

```python
from ward_client import WardClient

client = WardClient(xrpl_url="https://s.altnet.rippletest.net:51234/")

result = await client.purchase_coverage(
    wallet=institution_wallet,
    vault_address="rVaultXXX...",
    coverage_drops=10_000_000,
    period_days=90,
    pool_address="rPoolXXX...",
)
```

### Vault Monitor

```python
from ward_client import VaultMonitor

monitor = VaultMonitor(
    websocket_url="wss://s.altnet.rippletest.net:51233/",
    vault_addresses=["rVaultXXX..."],
)

@monitor.on_verified_default
async def handle_default(event):
    print(f"Default confirmed: {event}")

await monitor.run()
```

---

## Security Model

| Invariant | Enforcement |
|---|---|
| Ward never holds wallet keys | By architecture — no wallet in codebase |
| Policies non-transferable | tfBurnable only — XRPL enforces |
| No front-running on claims | PREIMAGE-SHA-256 — only claimant holds key |
| Clock manipulation impossible | XRPL ledger time for all expiry logic |
| Multi-confirmation before default | 3 ledger closes required |
| Replay attacks impossible | NFT burns on settlement |
| Rate limiting on claims | Max 3 attempts per NFT per 5-minute window |
| Address validation | All inputs validated with ledger codec |

See [security_notes.md](security_notes.md) for all 15 attack vectors.

---

## Running the Tests

```bash
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol
pip install xrpl-py pytest pytest-asyncio
pytest test_ward.py -v -m "not integration"   # 75/75 pass
python testnet_sim.py
```

---

## Repository Structure

```
ward-protocol/
├── ward_client.py           # PRIMARY SDK — 5 hardened modules
├── test_ward.py             # 75-test suite
├── testnet_sim.py           # End-to-end testnet simulation
├── testnet_proof.md         # 5 confirmed on-chain transaction hashes
├── security_notes.md        # 15 attack vectors and mitigations
├── REFACTOR.md              # Architecture history
├── ward/                    # Protocol primitives
│   ├── tx_builder.py        # Unsigned XRPL transaction construction
│   ├── chain_reader.py      # Read-only XRPL queries
│   └── monitor.py           # Embeddable vault health monitor
├── demo/                    # XRPLF grant demo
└── docs/                    # Specification documents
```

---

## Roadmap

### Phase 1 — Protocol Specification (Now → Q2 2026)
- [x] SDK built and tested — 95/95 tests
- [x] Testnet simulation confirmed — 5 on-chain transactions
- [x] XRPLF Discussion #474 — active community engagement
- [ ] Ward Protocol LLC — Wyoming filing
- [ ] XRPLF Grant application
- [ ] Security audit — Code4rena public contest
- [ ] Legal opinion — Ward is a software protocol, not an insurer

### Phase 2 — First Institutional Partner (Q2–Q3 2026)
- [ ] White-label licensing agreement
- [ ] Institution brings capital + regulatory licenses
- [ ] Ward provides the on-chain rails
- [ ] First mainnet deployment with institutional capital

### Phase 3 — Acquisition-Ready (2026–2027)
- [ ] Live institutional partners with demonstrable TVL
- [ ] Clean audit + legal opinion in hand
- [ ] XRPLF PR merged — Discussion #474 accepted
- [ ] Strategic conversation with institutional acquirer

---

## Community

- **Website:** [wardprotocol.org](https://wardprotocol.org)
- **API Docs:** [api.wardprotocol.org](https://api.wardprotocol.org)
- **XRPLF Discussion:** [#474](https://github.com/XRPLF/XRPL-Standards/discussions/474)
- **GitHub:** [wflores9/ward-protocol](https://github.com/wflores9/ward-protocol)
- **Email:** wflores@wardprotocol.org

---

## License

MIT — see [LICENSE](LICENSE)

---

*Ward Protocol · Software Specification · Not an insurance company ·
The spec is open. The rails are yours.*
