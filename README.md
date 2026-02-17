<p align="center">
  <img src="./assets/ward-protocol-logo.svg" alt="Ward Protocol" width="600">
</p>

<h1 align="center">Ward Protocol</h1>
<h3 align="center">Institutional Insurance for XRPL DeFi Lending</h3>

<p align="center">
  <a href="https://github.com/wflores9/ward-protocol"><img src="https://img.shields.io/badge/status-testnet-blue" alt="Status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://github.com/XRPLF/XRPL-Standards/discussions"><img src="https://img.shields.io/badge/XLS-discussion-orange" alt="XLS Discussion"></a>
</p>

---

## Overview

Ward Protocol provides institutional-grade insurance coverage for DeFi lending on the XRP Ledger. Built on top of XLS-66 (Lending Protocol), Ward enables lenders to insure against borrower defaults, liquidation slippage, and smart contract failures.

### Key Features

- **Real-Time Monitoring** - WebSocket-based XLS-66 default detection
- **9-Step Validation** - Automated claim validation using XLS-66/65 formulas
- **NFT Policies** - XLS-20 NFT-based policy certificates
- **Risk-Based Pricing** - Multi-factor premium calculation (0.5x-2.0x multipliers)
- **48-Hour Escrow** - Time-locked claim settlement with dispute window
- **XLS-30 AMM Pools** - Institutional capital aggregation (200% minimum coverage)

---

## Status

**In Development** - XLS Discussion Active

- [Specification](./docs/institutional-defi-insurance-specification.md) - Draft specification
- XLS Number: **Pending** (assigned automatically on PR submission)
- Testnet Deployment: **Live**

### Testnet Deployment

- **Network:** XRPL Testnet
- **Pool ID:** fccc5eca-4dfa-4ac7-966f-09ce5786ff76
- **Operator:** rPJsGb9V1NivCptS6P8KmsWaViVsUYfyLf
- **Pool Account:** rK4dpLy9bGVmNmnJNGzkHfNdhB7XzZh9iV
- **Initial Capital:** 1,000 XRP

---

## Architecture

Ward Protocol leverages existing XRPL primitives:

- **XLS-66 Vaults** - Monitor collateral and lending positions
- **XLS-30 AMM** - Insurance pool liquidity
- **Payment Transactions** - Premium collection and claim payouts
- **XLS-20 NFTs** - Policy certificates
- **Escrow** - Time-locked claim processing

---

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 14+
- XRPL testnet access

### Installation
```bash
# Clone repository
git clone https://github.com/wflores9/ward-protocol.git
cd ward-protocol

# Setup database
./database/setup_database.sh

# Install Python SDK
cd sdk/python
pip install -e .
```

### Testnet Deployment
```bash
# Create testnet wallets
python3 scripts/setup_testnet_wallets.py

# Deploy to testnet
python3 scripts/deploy_testnet.py

# Start monitoring
python3 scripts/start_monitor.py
```

### Run API & Dashboard
```bash
# Start API
python3 api/main.py

# Start dashboard (separate terminal)
cd web
python3 -m http.server 3000
```

- **API Docs:** http://localhost:8000/docs
- **Dashboard:** http://localhost:3000

---

## Repository Structure
```
ward-protocol/
├── docs/                   # Documentation and specifications
├── sdk/python/             # Python SDK for Ward Protocol
│   └── ward/              # Core modules
│       ├── monitor.py     # XLS-66 monitoring
│       ├── validator.py   # Claim validation
│       ├── policy.py      # Policy management
│       ├── premium.py     # Premium calculation
│       ├── pool.py        # AMM pool management
│       └── escrow.py      # Escrow settlement
├── database/              # PostgreSQL schema
├── api/                   # FastAPI REST API
├── web/                   # Web dashboard
├── docs-site/             # Documentation site
├── scripts/               # Deployment & admin scripts
├── tests/                 # Test suite
└── assets/                # Brand assets
```

---

## Use Cases

- **Institutional Lenders** - Protect against borrower defaults
- **DeFi Protocols** - Offer insured lending products
- **Large Capital Allocators** - Risk mitigation for XRPL lending

---

## Contributing

Ward Protocol follows the [XLS contribution process](https://github.com/XRPLF/XRPL-Standards/blob/master/CONTRIBUTING.md).

See [BRANDING.md](./BRANDING.md) for brand guidelines.

---

## License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## Contact

- **Repository:** https://github.com/wflores9/ward-protocol
- **XLS Discussion:** [To be updated after submission]
- **Testnet Explorer:** [Pool Account](https://testnet.xrpl.org/accounts/rK4dpLy9bGVmNmnJNGzkHfNdhB7XzZh9iV)

---

<p align="center">
  <strong>Built on the XRP Ledger</strong>
</p>
