# Ward Protocol

> `ward_signed = False — always.`
> Ward constructs unsigned transactions. Institutions sign. XRPL settles.
> Ward is never a counterparty, never a custodian, never a signatory.

[![CI](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml/badge.svg)](https://github.com/wflores9/ward-protocol/actions)
[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![npm](https://img.shields.io/npm/v/@wardprotocol/sdk)](https://www.npmjs.com/package/@wardprotocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Ward Protocol is the open specification for deterministic default resolution
for institutional lending vaults on the XRP Ledger (XLS-66 amendment in
validator voting). When a borrower defaults, nine on-chain checks run
automatically against live ledger state — no oracle, no human judgment,
no Ward signature. The outcome is the same every time, for every institution.

wardprotocol.org | wardprotocol.org/assurance | wardprotocol.org/demo

## Live Status

| Metric | Value |
|--------|-------|
| SDK Version | v0.2.9 |
| Hosted API | api.wardprotocol.org — live |
| Python Tests | 634/634 passing (3.10 · 3.11 · 3.12) |
| Rust Tests | 22/22 passing |
| TypeScript Tests | 53/53 passing |
| Critical Path Coverage | 92% |
| Formal Invariants | 32 (TLA+ verified) |
| Open CVEs | 0 |
| XRPLF Standard | Discussion #474 — active |

## The Nine Checks

| Step | Check |
|------|-------|
| 1 | NFT existence + taxon 281 (XLS-20) |
| 2 | Policy validity — ledger close_time + on-chain premium payment |
| 3 | Vault address binding — NFT metadata vault == defaulted vault |
| 4 | LSF_LOAN_DEFAULT flag on LedgerEntry(index=loan_id) |
| 5 | Vault loss > 0 drops |
| 6 | Pool usable balance >= vault loss (balance - XRPL reserve) |
| 7 | Replay protection — NFT still live (burn-on-settlement) |
| 8 | Claimant holds NFT — AccountNFTs(account=claimant) |
| 9 | Pool solvency + rate limit (<=3/NFT/300s, ratio >=1.5x) |

## Install

```bash
pip install ward-protocol          # Python SDK
npm install @wardprotocol/sdk      # TypeScript SDK
```

Hosted API: https://api.wardprotocol.org

## Quick Start

```python
import asyncio
from ward import WardClient, ClaimValidator

# Validate a default claim — 9 steps, all on-chain
validator = ClaimValidator(url="https://s.altnet.rippletest.net:51234/")
claim = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="A" * 64,
    defaulted_vault="rVaultXXX...",
    loan_id="B" * 64,
    pool_address="rPoolXXX...",
)
print(claim.approved)           # True
print(claim.steps_passed)       # 9
print(claim.ward_signed)        # False — always
```

## Multi-Chain

| Chain | Status | Notes |
|-------|--------|-------|
| XRPL | Live | Altnet confirmed, mainnet at XLS-66 activation |
| Solana | In development | Devnet environment provisioned |
| Stellar | Roadmap | Soroban scoped, Q3 2026 |
| Flare | Roadmap | FDC integration scoped |
| XDC | Roadmap | Compatibility assessment underway |
| Polygon | Roadmap | EVM adapter scoped |
| Algorand | Roadmap | SDK provisioned |
| XRPL EVM | Roadmap | EVM sidechain scoped |

## Running Tests

```bash
# Python (634 tests)
pip install -r requirements.txt
python3 -m pytest tests/ -v

# Rust (22 tests)
cd ward && cargo test

# TypeScript (53 tests)
cd sdk/typescript && npm install && npm test
```

## Assurance

Full pre-mainnet security report, TLA+ formal spec, and continuous
scanning results: wardprotocol.org/assurance

- 634 automated tests, 92% critical path coverage
- 32 formal invariants verified in TLA+
- 0 open CVEs (Aikido continuous SAST/SCA scanning)
- Git history scrubbed and verified clean
- ward_signed = False enforced at 4 independent layers

## Community

- Discord: discord.gg/j45hnRP3HW
- XRPLF Discussion #474: github.com/XRPLF/XRPL-Standards/discussions/474
- Website: wardprotocol.org
- X: x.com/wardprotocol

## Commercial

The SDK and specification are MIT licensed — free forever.
Mainnet API, Ward-conformant certification, and enterprise support
require a commercial license. See COMMERCIAL.md.

Contact: team@wardprotocol.org

## License

MIT — see LICENSE file.

ward_signed = False — always.
