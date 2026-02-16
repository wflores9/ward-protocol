# Ward Protocol

**Institutional Insurance for XRPL DeFi Lending**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![XLS-103d](https://img.shields.io/badge/XLS-103d-blue.svg)](./docs/XLS-103d-specification.md)

## Overview

Ward Protocol provides institutional-grade insurance coverage for lenders participating in the XLS-66 Lending Protocol on the XRP Ledger. Built as an ecosystem application using existing XRPL primitives, Ward enables rapid deployment without requiring protocol amendments.

## Status

🚧 **In Development** - XLS-103d Draft (Ecosystem Category)

- **Specification**: [XLS-103d](./docs/XLS-103d-specification.md)
- **GitHub Discussion**: *To be created*
- **Testnet Deployment**: *Week 4-6*

## Key Features

- ✅ Insurance for XLS-66 lending defaults
- ✅ XLS-20 NFT policy certificates
- ✅ XLS-30 AMM liquidity pools
- ✅ Automated claim processing
- ✅ Escrow-based settlements
- ✅ No protocol amendment required

## Architecture
```
┌─────────────────────────────────────────┐
│   Ward Protocol (XLS-103d Ecosystem)    │
│   Insurance Layer for DeFi Lending      │
└─────────────────────────────────────────┘
              ↓ ↓ ↓
┌─────────────────────────────────────────┐
│   XLS-66 Lending Protocol (Mainnet)     │
│   Fixed-term Uncollateralized Loans     │
└─────────────────────────────────────────┘
```

**Ward Protocol uses:**
- **XLS-66 Vaults** - Monitor collateral and loan state
- **XLS-30 AMM** - Insurance pool liquidity
- **XLS-20 NFTs** - Policy certificates
- **Payment** - Premium collection and payouts
- **Escrow** - Time-locked claim settlements

## Use Cases

### Institutional Lenders
Protect vault deposits against defaults beyond first-loss capital coverage.

### DeFi Protocols
Offer insured lending products to attract institutional capital.

### Capital Allocators
Deploy capital into DeFi lending with institutional-grade risk management.

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

# Install dependencies
pip install -r requirements.txt

# Set up database
psql -U postgres -c "CREATE DATABASE ward_protocol;"

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Run Example
```python
from ward import InsurancePool
from xrpl.clients import JsonRpcClient

client = JsonRpcClient("https://s.altnet.rippletest.net:51234")

# Create insurance pool
pool = InsurancePool(client, asset="XRP")
pool.initialize(initial_capital=100000)

# Issue policy
policy = pool.create_policy(
    insured_vault="vault://abc123",
    coverage=10000,
    term_days=90
)

print(f"Policy issued: {policy.nft_id}")
```

## Repository Structure
```
ward-protocol/
├── docs/                      # Documentation
│   └── XLS-103d-specification.md
├── sdk/                       # Python SDK
│   └── python/
│       └── ward/
│           ├── pool.py        # AMM pool management
│           ├── policy.py      # NFT policy issuance
│           ├── claims.py      # Claim processing
│           ├── xls66.py       # XLS-66 integration
│           └── escrow.py      # Settlement logic
├── examples/                  # Example code
├── tests/                     # Test suite
└── deployment/                # Deployment configs
```

## Development Roadmap

### Phase 1: Specification (Week 1-2) ✅
- [x] XLS-103d specification
- [x] GitHub repository setup
- [ ] Create GitHub Discussion

### Phase 2: Core Development (Week 3-4)
- [ ] Insurance pool SDK
- [ ] Policy NFT minting
- [ ] XLS-66 monitoring service
- [ ] Premium calculation engine

### Phase 3: Testnet (Week 5-6)
- [ ] Deploy to XRPL testnet
- [ ] Integration testing
- [ ] Community feedback

### Phase 4: Mainnet Pilot (Month 2-3)
- [ ] Limited mainnet launch
- [ ] Institutional partnerships
- [ ] Security audit

### Phase 5: Public Launch (Month 4+)
- [ ] Open to all participants
- [ ] Multiple asset pools
- [ ] Governance framework

## Contributing

Ward Protocol follows the [XLS contribution process](https://github.com/XRPLF/XRPL-Standards/blob/master/CONTRIBUTING.md).

### How to Contribute

1. Review [XLS-103d specification](./docs/XLS-103d-specification.md)
2. Open issues for bugs or feature requests
3. Submit pull requests with tests
4. Participate in GitHub Discussions

## Security

- **Multi-signature** pool management (3-of-5 institutional signers)
- **200% reserve ratio** minimum
- **48-hour Escrow** claim validation period
- **No custom smart contracts** (uses only native XRPL primitives)

**Found a security issue?** Email: security@wardprotocol.org

## Resources

- [XLS-103d Specification](./docs/XLS-103d-specification.md)
- [XLS-66 Lending Protocol](https://opensource.ripple.com/docs/xls-66-lending-protocol)
- [XRPL Documentation](https://xrpl.org/docs)
- [XRPL Standards Repository](https://github.com/XRPLF/XRPL-Standards)

## License

MIT License - See [LICENSE](./LICENSE) file for details

## Contact

- **Repository**: https://github.com/wflores9/ward-protocol
- **Email**: wflores@wardprotocol.org
- **XLS Discussion**: *Coming soon*

---

**Built on the XRP Ledger** 🛡️
