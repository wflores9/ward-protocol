<div align="center">

  <br/>
  <br/>

  **Institutional Insurance for XRPL DeFi Lending**

  [![PyPI](https://img.shields.io/pypi/v/ward-protocol?label=PyPI&color=blue)](https://pypi.org/project/ward-protocol/)
  [![Python 3.12](https://img.shields.io/badge/Python-3.12-3776ab)](https://www.python.org/downloads/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Live API](https://img.shields.io/badge/Live%20API-online-brightgreen)](https://api.wardprotocol.org)
  [![Tests: 75/75](https://img.shields.io/badge/Tests-75%2F75%20passing-brightgreen)](test_ward.py)
  [![XRPL: Discussion](https://img.shields.io/badge/XRPL-Discussion-orange)](https://github.com/XRPLF/XRPL-Standards/discussions)

  [Website](https://wardprotocol.org) • [API Docs](https://api.wardprotocol.org/docs) • [PyPI](https://pypi.org/project/ward-protocol/)
</div>

---

## Overview

Ward Protocol provides institutional-grade insurance for XRP Ledger DeFi lending protocols. We protect XLS-66 vault depositors against borrower defaults, liquidation slippage, and smart contract failures through automated, on-chain coverage.

**Current Status:** Testnet-proven SDK — 5 hardened modules, 75/75 unit tests passing, full end-to-end simulation confirmed on XRPL Altnet.

---

## Why Ward Protocol?

The XRPL ecosystem faces a critical infrastructure gap: **institutions will not deposit significant capital in uninsured lending protocols.** Without insurance, XRPL DeFi remains limited to retail participants.

Ward Protocol solves this by providing the missing insurance layer that makes institutional DeFi participation possible on XRPL.

### Key Statistics

| Metric | Value |
|--------|-------|
| **Pool Capital** | 1,000 XRP (testnet) |
| **Coverage Ratio** | 78x+ (well above 200% minimum) |
| **Unit Tests** | 75/75 passing |
| **On-Chain Txns Confirmed** | 5 (see [testnet_proof.md](testnet_proof.md)) |
| **External Service Dependencies** | 0 — pure XRPL, no database |

---

## Features

### **Real-Time Monitoring**
WebSocket-based XLS-66 default detection with 3-ledger multi-confirmation and anomaly detection.

### **9-Step Validation**
Adversarial-hardened claim validation — every step queries XRPL directly. If any step cannot be fully verified on-chain, the claim is rejected.

### **NFT Policies**
XLS-20 NFT-based policy certificates: non-transferable, burnable, with full on-chain metadata. Policies are bound to the minting wallet — they cannot be sold or forged.

### **Risk-Based Pricing**
Multi-factor premium calculation with 0.5x–2.0x risk multipliers based on vault metrics and coverage ratio.

### **48-Hour Escrow**
Time-locked claim settlement with community dispute window before payout.

### **Zero Service Dependency**
Ward sells software. Institutions hold keys. The protocol survives Ward's servers going offline because all state lives on XRPL.

---

## Technology Stack

**XRPL Native:**
- XLS-66 (Lending Protocol)
- XLS-30 (Automated Market Maker)
- XLS-20 (NFT Standard)
- Native Escrow with PREIMAGE-SHA-256 crypto conditions

**SDK:**
- Python 3.12 with xrpl-py 4.x
- Zero external service dependencies — no database, no API server required
- 75 unit tests, asyncio_mode=auto, no network required for tests

---

## Testnet Proof

Full end-to-end simulation confirmed on XRPL Altnet (2026-03-01). All 5 transactions verifiable on the testnet explorer.

| Step | Type | Transaction Hash |
|------|------|-----------------|
| Premium payment | `Payment` | [`D541B6A2...76783169`](https://testnet.xrpl.org/transactions/D541B6A2156E4BB3B22D9BD1D451598DF2D0387A25B73A5918A8779D76783169) |
| Policy NFT mint | `NFTokenMint` | [`B323815A...E148CDF`](https://testnet.xrpl.org/transactions/B323815A6C7BA98935D2C2AA3CFC94BB956E59BA716A59430F2183D2AE148CDF) |
| Escrow create | `EscrowCreate` | [`9BB570DB...BB3001C`](https://testnet.xrpl.org/transactions/9BB570DBC6CB9EB11339FBBDA4920E03EC2CC49EC547CBF0D031C8AABC48B0A3) |
| Escrow finish | `EscrowFinish` | [`E65C35A5...D0A3DBB`](https://testnet.xrpl.org/transactions/E65C35A568AE93E6D8A628F36A217DACB1B2A7E1A8F0A7B0912E510AED0A3DBB) |
| NFT policy burn | `NFTokenBurn` | [`A5A0652C...B464D8`](https://testnet.xrpl.org/transactions/A5A0652C4DA629F0D46D2A3504FDC22E410848AF5D27E956E3997346A7B464D8) |

See [testnet_proof.md](testnet_proof.md) for full details including NFT token ID, balance changes, and the one bug discovered during the testnet run.

---

## SDK — `ward_client.py`

The primary deliverable is a single self-contained Python module with five hardened modules.

### Installation

```bash
pip install ward-protocol
```

**For development** (clone + run tests):

```bash
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol
pip install xrpl-py pytest pytest-asyncio

# Run tests (unit tests only, no network required)
pytest test_ward.py -v -m "not integration"

# Full testnet simulation (XRPL Altnet required)
python testnet_sim.py
```

### Module Overview

| Module | Class | Purpose |
|--------|-------|---------|
| 1 | `WardClient` | Purchase a policy (premium + NFT mint) |
| 2 | `VaultMonitor` | WebSocket default detection with multi-confirmation |
| 3 | `ClaimValidator` | 9-step adversarial-hardened on-chain validation |
| 4 | `EscrowSettlement` | PREIMAGE-SHA-256 conditioned escrow payout |
| 5 | `PoolHealthMonitor` | On-chain solvency and dynamic premium pricing |

### Module 1 — Purchase Coverage

```python
from ward_client import WardClient

client = WardClient(xrpl_url="https://s.altnet.rippletest.net:51234/")

result = await client.purchase_coverage(
    wallet=depositor_wallet,          # Depositor's wallet — Ward never stores it
    vault_address="rVaultXXX...",     # XLS-66 vault being insured
    coverage_drops=10_000_000,        # 10 XRP coverage (in drops)
    period_days=30,
    pool_address="rPoolXXX...",       # Insurance pool
    premium_rate=0.01,                # 1% annual rate
)
# Returns: {"policy_id", "nft_token_id", "ledger_tx", "expiry_ledger_time", ...}
```

The depositor's wallet mints its own NFT — **Ward never holds keys**.
NFT flags: `tfBurnable` only. `tfTransferable` is deliberately absent — policies cannot be sold.

### Module 2 — Vault Monitor

```python
from ward_client import VaultMonitor

monitor = VaultMonitor(
    websocket_url="wss://s.altnet.rippletest.net:51233/",
    vault_addresses=["rVaultXXX..."],
    loan_broker_addresses=["rBrokerXXX..."],
)

@monitor.on_verified_default
async def handle_default(event):
    print(f"Default confirmed after 3 ledger closes: {event}")

@monitor.on_anomaly
async def handle_anomaly(event):
    print(f"ALERT: Rapid default signals from {event['vault_address']}")

await monitor.run()
```

All events are cross-validated against the live ledger. Anomaly detection alerts on ≥5 signals in 5 minutes.

### Module 3 — Claim Validator

```python
from ward_client import ClaimValidator

validator = ClaimValidator(xrpl_url="https://s.altnet.rippletest.net:51234/")

result = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="ABCD...",           # 64 hex chars
    defaulted_vault="rVaultXXX...",
    loan_id="EFGH...",
    pool_address="rPoolXXX...",
)

if result.approved:
    print(f"Payout: {result.claim_payout_drops / 1e6:.4f} XRP")
else:
    print(f"Rejected at step {result.steps_passed + 1}: {result.rejection_reason}")
```

All 9 steps query XRPL directly. If any step cannot be fully verified on-chain, the claim is rejected.

### Module 4 — Escrow Settlement

```python
from ward_client import EscrowSettlement, generate_claim_condition

# 1. CLAIMANT generates their secret preimage offline
preimage, condition_hex, fulfillment_hex = generate_claim_condition()
# Claimant keeps preimage and fulfillment_hex secret

# 2. POOL OPERATOR creates the escrow (using claimant's condition)
settlement = EscrowSettlement()
record = await settlement.create_claim_escrow(
    pool_wallet=pool_wallet,
    claimant_address="rClaimantXXX...",
    payout_drops=5_000_000,
    condition_hex=condition_hex,      # Provided by claimant — Ward never sees preimage
    nft_token_id="ABCD...",
    claim_id="claim-001",
)

# 3. After 48 hours, CLAIMANT finishes the escrow with their preimage
result = await settlement.finish_escrow(
    claimant_wallet=claimant_wallet,
    escrow_record=record,
    fulfillment_hex=fulfillment_hex,  # Only claimant knows this
    nft_wallet=claimant_wallet,       # NFT burned atomically
)
# NFT is burned on settlement — replay protection
```

### Module 5 — Pool Health Monitor

```python
from ward_client import PoolHealthMonitor

monitor = PoolHealthMonitor(pool_address="rPoolXXX...")

health = await monitor.get_health(active_coverage_drops=50_000_000)
print(f"Coverage ratio: {health.coverage_ratio:.2f}x ({health.risk_tier})")
print(f"Minting allowed: {monitor.is_minting_allowed(health)}")

quote = monitor.calculate_premium(health, coverage_drops=10_000_000, term_days=30)
print(f"Premium: {quote['premium_drops'] / 1e6:.4f} XRP ({quote['annual_rate']*100:.1f}% annual)")
```

---

## Architecture

```
Depositor wallet                Pool wallet (institution)
      │                               │
      │  purchase_coverage()          │
      │  ┌─────────────────────┐      │
      │  │ 1. Payment (premium)│──────►  pool_address
      │  │ 2. NFTokenMint      │      │  (non-transferable, burnable NFT)
      │  └─────────────────────┘      │
      │                               │
      │  [VaultMonitor — institution's infra]
      │        │                      │
      │        │ LoanManage/default   │
      │        │ detected on-chain    │
      │        ▼                      │
      │  3x ledger confirmation       │
      │        │                      │
      │        ▼                      │
      │  ClaimValidator (9 steps)     │
      │        │                      │
      │        │ approved             │
      │        ▼                      │
      │  EscrowCreate ←───────────────┘
      │  condition = SHA256(claimant_preimage)
      │  finish_after = now + 48h
      │        │
      │  [48-hour dispute window]
      │        │
      ▼        ▼
  EscrowFinish(fulfillment=preimage) + NFTokenBurn
  Only claimant can finish — no front-running possible
```

**Security invariants enforced by XRPL natively:**
- NFT non-transferability (no `tfTransferable` flag) — policies can't be sold
- PREIMAGE-SHA-256 escrow conditions — claimant holds the key to their own payout
- NFT burn as replay protection — settled policy disappears from `account_nfts`
- XRPL ledger time for all expiry — immune to local clock manipulation

---

## Quick Start

### Prerequisites
- Python 3.12+
- xrpl-py >= 4.0.0
- XRPL Testnet account (for testnet simulation only)

### Running the SDK

```bash
pip install ward-protocol

# Or clone for development:
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol
pip install xrpl-py pytest pytest-asyncio

# Unit tests (no network)
pytest test_ward.py -v -m "not integration"

# Full testnet simulation (requires XRPL Altnet)
python testnet_sim.py
```

---

## Live Deployment

### Testnet

- **Network:** XRPL Testnet
- **Pool Account:** `rK4dpLy9bGVmNmnJNGzkHfNdhB7XzZh9iV`
- **Operator:** `rPJsGb9V1NivCptS6P8KmsWaViVsUYfyLf`
- **Initial Capital:** 1,000 XRP

---

## Repository Structure

```
ward-protocol/
├── ward_client.py           # PRIMARY DELIVERABLE — 5 hardened SDK modules
├── test_ward.py             # 75-test suite (unit, no network required)
├── testnet_sim.py           # End-to-end testnet simulation script
├── testnet_proof.md         # Confirmed on-chain transaction hashes
├── security_notes.md        # 15 attack vectors and mitigations
├── ward/                    # Protocol primitives (TxBuilder, ChainReader, WardMonitor)
│   ├── tx_builder.py        # Build unsigned XRPL transactions
│   ├── chain_reader.py      # Read-only XRPL queries
│   └── monitor.py           # Polling-based vault monitoring
├── sdk/python/              # Full SDK package (examples, models, legacy submodule)
│   ├── ward/                # SDK submodule (policy, monitor, validator, escrow)
│   └── examples/            # Usage examples
├── demo/                    # Protocol demonstration
├── docs/                    # Specification documents
│   ├── institutional-defi-insurance-specification.md
│   ├── XLS-103d-specification.md
│   └── xls-discussion-draft.md
└── pytest.ini               # Test configuration
```

---

## Roadmap

### Phase 1: Mainnet MVP (Q2 2026) - **Current Focus**
**Goal:** One successful vault operator

- [x] SDK built and tested (ward_client.py, 75/75 tests)
- [x] Testnet simulation confirmed (5 on-chain transactions)
- [ ] Security audit ($15k-50k)
- [ ] Mainnet deployment with 10,000 XRP pool
- [ ] First vault partner secured
- [ ] Integration documentation for vault operators

### Phase 2: Scale to 10 Vaults (Q3 2026)
**Goal:** Proven product-market fit

- [ ] Multi-vault auto-discovery
- [ ] Advanced risk scoring
- [ ] Webhook notifications
- [ ] Dashboard for vault operators
- [ ] High-availability infrastructure

### Phase 3: Enterprise Grade (Q4 2026)
**Goal:** Institutional adoption

- [ ] Cross-chain support (Ethereum, Solana)
- [ ] ML risk models
- [ ] SOC2 Type II certification
- [ ] RWA insurance products
- [ ] Liquidation protection coverage

---

## Contributing

Ward Protocol is open source and welcomes contributions!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Community

- **Website:** [wardprotocol.org](https://wardprotocol.org)
- **GitHub:** [github.com/wflores9/ward-protocol](https://github.com/wflores9/ward-protocol)
- **XRPL Discussion:** [XRPL-Standards](https://github.com/XRPLF/XRPL-Standards/discussions)
- **Email:** [wflores@wardprotocol.org](mailto:wflores@wardprotocol.org)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built on the XRP Ledger with:
- [XLS-66 Lending Protocol](https://github.com/XRPLF/XRPL-Standards/discussions/XLS-66)
- [XLS-30 Automated Market Maker](https://xrpl.org/docs/concepts/tokens/decentralized-exchange/automated-market-makers/)
- [XLS-20 NFT Standard](https://xrpl.org/docs/concepts/tokens/nfts/)

---

<div align="center">
  <strong>The tech is ready. The ecosystem needs infrastructure. Let's ship.</strong>
  <br/>
  <br/>
</div>
