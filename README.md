# Ward Protocol

**The open specification for XLS-66 vault default protection on the XRP Ledger.**

[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tests: 75/75](https://img.shields.io/badge/tests-75%2F75-brightgreen)](test_ward.py)
[![XRPL: Discussion](https://img.shields.io/badge/XRPLF-Discussion%20%23474-blue)](https://github.com/XRPLF/XRPL-Standards/discussions/474)

[Website](https://wardprotocol.org) · [API Docs](https://api.wardprotocol.org) · [PyPI](https://pypi.org/project/ward-protocol/) · [XRPLF Discussion #474](https://github.com/XRPLF/XRPL-Standards/discussions/474)

---

## What Ward Protocol Is

Ward Protocol is a **software specification** — not an insurance company, not an operator, not a service.

Ward defines the open standard for default protection on XLS-66 vaults. Institutions that want to offer coverage to vault depositors implement Ward's specification using their own wallets, their own capital, and their own regulatory licenses.

**Ward writes the rules. Institutions run the rails. Everything settles on XRPL.**

This is the same model as Stripe for payments — Stripe doesn't hold your money, they define the protocol that moves it. Ward doesn't hold depositor funds, it defines the protocol that protects them.

---

## The Core Invariant

```python
# Ward NEVER does this:
await submit_and_wait(tx, client, ward_wallet)  # Ward has no wallet

# Ward ALWAYS does this:
return UnsignedTransaction(tx_dict=tx.to_dict(), ward_signed=False)
# Institution signs and submits with their own wallet
```

Ward constructs unsigned XRPL transactions. Institutions sign them. The XRP Ledger enforces the outcome. Ward's server is irrelevant once a transaction is on-chain.

---

## Current Status

**Testnet-proven SDK — 5 confirmed on-chain transactions, 75/75 unit tests passing.**

| Metric | Value |
|--------|-------|
| SDK Version | 0.1.0 |
| Unit Tests | 75/75 passing |
| On-Chain Transactions Confirmed | 5 (XRPL Altnet) |
| External Service Dependencies | 0 — pure XRPL |
| Ward Holds Keys | Never |
| Authoritative State Location | XRPL Ledger |
| XRPLF Standards | XLS-66 · XLS-70 · XLS-80 · XLS-20 |

---

## Confirmed On-Chain Transactions

All 5 transactions verified on XRPL Testnet Explorer — 2026-03-01.

| Step | Type | Hash |
|------|------|------|
| 1 — Premium Payment | `Payment` | [`D541B6A2...783169`](https://testnet.xrpl.org/transactions/D541B6A2156E4BB3B22D9BD1D451598DF2D0387A25B73A5918A8779D76783169) |
| 2 — Policy NFT Mint | `NFTokenMint` | [`B323815A...148CDF`](https://testnet.xrpl.org/transactions/B323815A6C7BA98935D2C2AA3CFC94BB956E59BA716A59430F2183D2AE148CDF) |
| 3 — Escrow Create | `EscrowCreate` | [`9BB570DB...B0A3`](https://testnet.xrpl.org/transactions/9BB570DBC6CB9EB11339FBBDA4920E03EC2CC49EC547CBF0D031C8AABC48B0A3) |
| 4 — Escrow Finish | `EscrowFinish` | [`E65C35A5...A3DBB`](https://testnet.xrpl.org/transactions/E65C35A568AE93E6D8A628F36A217DACB1B2A7E1A8F0A7B0912E510AED0A3DBB) |
| 5 — Policy NFT Burn | `NFTokenBurn` | [`A5A0652C...464D8`](https://testnet.xrpl.org/transactions/A5A0652C4DA629F0D46D2A3504FDC22E410848AF5D27E956E3997346A7B464D8) |

See [`testnet_proof.md`](testnet_proof.md) for full details — NFT token ID, balance changes, and the one bug discovered during the testnet run.

---

## Protocol Stack

Ward connects four existing XRPL standards into a coherent default protection specification:

| Standard | Role | Ward's Contribution |
|----------|------|---------------------|
| **XLS-80** | Permissioned Domains | Defines compliant domain configuration for institutional vault access |
| **XLS-70** | On-Chain Credentials | Defines credential schema for KYC/AML-gated participation |
| **XLS-66** | Lending Vaults | Defines monitoring spec and default detection threshold (health ratio < 1.5) |
| **XLS-20** | NFT Policies | Defines policy metadata schema (taxon=281, `tfBurnable`, no `tfTransferable`) |
| **XRPL Escrow** | Settlement | Defines PREIMAGE-SHA-256 condition structure for claim settlement |

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

**Three phases, all on-chain:**

1. **Setup** — Institution calls `TxBuilder.register_vault()`. Ward returns an unsigned `AccountSet` transaction. Institution signs and submits with their own wallet. Vault appears in XLS-80 domain registry on XRPL.

2. **Coverage** — Institution calls `TxBuilder.mint_policy_nft()`. Ward returns an unsigned `NFTokenMint` with Ward's metadata schema encoded in the URI. Institution mints the NFT — it's their certificate, not Ward's.

3. **Default & Settlement** — `WardMonitor` runs in the institution's own infrastructure. On default detection (vault health ratio < 1.5, confirmed over 3 ledger closes), Ward builds an unsigned `EscrowCreate`. Institution signs it. XRPL locks funds for 48 hours. Claimant finishes with PREIMAGE-SHA-256 fulfillment. NFT burns atomically — replay protection enforced by the ledger.

---

## SDK

```bash
pip install ward-protocol
```

### Five Hardened Modules

| Module | Class | Purpose |
|--------|-------|---------|
| 1 | `WardClient` | Policy purchase — premium payment + NFT mint |
| 2 | `VaultMonitor` | WebSocket default detection, 3-ledger confirmation |
| 3 | `ClaimValidator` | 9-step adversarial-hardened on-chain validation |
| 4 | `EscrowSettlement` | PREIMAGE-SHA-256 conditioned claim settlement |
| 5 | `PoolHealthMonitor` | On-chain solvency and dynamic premium pricing |

### Quick Start

```python
from ward_client import WardClient

client = WardClient(xrpl_url="https://s.altnet.rippletest.net:51234/")

# Ward builds the transaction — institution's wallet signs it
result = await client.purchase_coverage(
    wallet=institution_wallet,        # Institution's wallet — Ward never stores it
    vault_address="rVaultXXX...",
    coverage_drops=10_000_000,        # 10 XRP in drops
    period_days=90,
    pool_address="rPoolXXX...",
)
# Returns: {"policy_id", "nft_token_id", "ledger_tx", "expiry_ledger_time"}
```

### Vault Monitor — Runs in Institution's Infrastructure

```python
from ward_client import VaultMonitor

# Institution runs this in their own servers — not Ward's
monitor = VaultMonitor(
    websocket_url="wss://s.altnet.rippletest.net:51233/",
    vault_addresses=["rVaultXXX..."],
)

@monitor.on_verified_default
async def handle_default(event):
    # Ward detected the default. Institution decides what to do.
    # Ward builds the escrow tx. Institution signs it.
    print(f"Default confirmed: {event}")

await monitor.run()
```

---

## Security Model

Eight security invariants — all enforced by the XRPL ledger, not Ward's server:

| Invariant | Enforcement |
|-----------|-------------|
| Ward never holds wallet keys | By architecture — no wallet in Ward's codebase |
| Policies non-transferable | `tfBurnable` only, no `tfTransferable` — XRPL enforces |
| No front-running on claims | PREIMAGE-SHA-256 — only claimant holds the key |
| Clock manipulation impossible | XRPL ledger time for all expiry logic |
| Multi-confirmation before default | 3 ledger closes required — no single-block manipulation |
| Replay attacks impossible | NFT burns on settlement — ledger confirms absence |
| Rate limiting on claims | Max 3 attempts per NFT per 5-minute window |
| Address validation | All inputs validated with ledger codec before any tx |

See [`security_notes.md`](security_notes.md) for all 15 attack vectors and mitigations.

---

## Running the Tests

```bash
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol
pip install xrpl-py pytest pytest-asyncio

# Unit tests — no network required
pytest test_ward.py -v -m "not integration"   # 75/75 pass

# Full testnet simulation — XRPL Altnet required
python testnet_sim.py
```

---

## Repository Structure

```
ward-protocol/
├── ward_client.py           # PRIMARY SDK — 5 hardened modules
├── test_ward.py             # 75-test suite (unit, no network)
├── testnet_sim.py           # End-to-end testnet simulation
├── testnet_proof.md         # 5 confirmed on-chain transaction hashes
├── security_notes.md        # 15 attack vectors and mitigations
├── REFACTOR.md              # Architecture history — operator → protocol
├── ward/                    # Protocol primitives
│   ├── tx_builder.py        # Unsigned XRPL transaction construction
│   ├── chain_reader.py      # Read-only XRPL queries, no Ward DB
│   └── monitor.py           # Embeddable vault health monitor
├── demo/                    # XRPLF grant demo (3-minute end-to-end)
└── docs/                    # Specification documents
```

---

## Roadmap

### Phase 1 — Protocol Specification (Now → Q2 2026)
- [x] SDK built and tested — `ward_client.py`, 75/75 tests
- [x] Testnet simulation confirmed — 5 on-chain transactions
- [x] XRPLF Discussion #474 — active community engagement
- [ ] XRPLF Grant application — demo as primary evidence
- [ ] Security audit ($15k–$50k, funded by grant)
- [ ] Legal opinion — Ward is a software protocol, not an insurer

### Phase 2 — First Institutional Partner (Q2–Q3 2026)
- [ ] White-label licensing agreement with InsurTech or Lloyd's syndicate
- [ ] Institution brings underwriting + regulatory licenses
- [ ] Ward provides the on-chain rails
- [ ] First mainnet deployment with institutional capital

### Phase 3 — Acquisition-Ready (2027)
- [ ] Live institutional partners with demonstrable TVL
- [ ] Clean audit + legal opinion in hand
- [ ] XRPLF PR merged — XLS-0098 recognized standard
- [ ] Strategic conversation with Ripple or institutional acquirer

---

## Why This Architecture Matters

Ripple acquired Hidden Road for settlement infrastructure. They backed t54 for identity. They have RLUSD for liquidity. **They don't have default protection for XLS-66 vaults.** Ward is that piece.

The acquisition pitch is not "buy our insurance company." It is "buy the risk management specification layer that makes your institutional DeFi stack complete."

That conversation requires three things Ward is building toward:
1. **Embedded** — vault operators integrated deeply enough that removal is painful
2. **Audited** — on-chain claims history that can't be reproduced overnight
3. **Clean legal structure** — written opinion that Ward is a software protocol, not an insurer

All three depend on the code never signing a transaction. See [`REFACTOR.md`](REFACTOR.md).

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

*Ward Protocol · Software Specification · Not an insurance company · The spec is open. The rails are yours.*

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on the protocol vs SDK layers and contribution guidelines.
