# Ward Protocol

[![Version](https://img.shields.io/badge/SDK-v0.2.5-gold)](https://pypi.org/project/ward-protocol/)
[![Tests](https://img.shields.io/badge/tests-317%20Python%20%C2%B7%2040%20Rust%20%C2%B7%2045%20TypeScript-brightgreen)](#running-tests)
[![CI](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml/badge.svg)](https://github.com/wflores9/ward-protocol/actions/workflows/test.yml)
[![PyPI](https://img.shields.io/pypi/v/ward-protocol)](https://pypi.org/project/ward-protocol/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> **`ward_signed = False — always.`**
> Ward constructs unsigned transactions. Institutions sign. XRPL settles.
> Ward is never a counterparty, never a custodian, never a signatory.

---

## Overview

Ward Protocol is the open specification for deterministic default resolution on XLS-66 institutional lending vaults on the XRP Ledger. When a borrower defaults, nine on-chain checks run automatically against live ledger state — no oracle, no human judgment, no Ward signature. The outcome is the same every time, for every institution, regardless of who runs the vault. See real-world scenarios at [wardprotocol.org/use-cases](https://wardprotocol.org/use-cases).

---

## How It Works

Full specification at [wardprotocol.org/spec](https://wardprotocol.org/spec).

Nine deterministic steps — all state from the XRPL ledger:

| Step | Check |
|------|-------|
| 1 | NFT existence + taxon 281 (XLS-20) |
| 2 | Policy expiry — ledger `close_time`, never server clock |
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
| SDK Version | v0.2.5 |
| Hosted API | api.wardprotocol.org — live |
| Python Tests | 317/317 passing (3.10 · 3.11 · 3.12) |
| Rust Tests | 40/40 passing |
| TypeScript Tests | 45/45 passing |
| Altnet E2E | F·01–F·04 confirmed on-chain |
| XRPLF Standard | Discussion #474 — active |
| Swell 2026 | Application submitted |

---

## Quick Start

```python
pip install ward-protocol==0.2.5
```

```python
import asyncio
from ward import WardClient, ClaimValidator

# Purchase default-protection coverage
client = WardClient(url="https://s.altnet.rippletest.net:51234/")
result = await client.purchase_coverage(
    wallet=depositor_wallet,        # institution signs — Ward never does
    vault_address="rVaultXXX...",
    coverage_drops=500_000_000,     # 500 XRP
    period_days=90,
    pool_address="rPoolXXX...",
)
assert result["ward_signed"] is False  # invariant

# Validate a claim — 9 steps, all on-chain
validator = ClaimValidator(url="https://s.altnet.rippletest.net:51234/")
claim = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="A" * 64,
    defaulted_vault="rVaultXXX...",
    loan_id="B" * 64,
    pool_address="rPoolXXX...",
)
print(claim.approved)            # True
print(claim.steps_passed)        # 9
print(claim.claim_payout_drops)  # min(vault_loss, policy_coverage)
```

---

## SDK & API

```bash
pip install ward-protocol          # Python SDK
npm install ward-protocol          # TypeScript SDK
```

**Hosted API:** `https://api.wardprotocol.org`
- `GET  /health` — status check
- `POST /keys/generate` — API key (Developer tier, no auth required)
- `POST /validate` — 9-step claim validation
- `POST /purchase` — unsigned coverage transaction

Full docs: [wardprotocol.org/docs](https://wardprotocol.org/docs)  
Build guide: [wardprotocol.org/build](https://wardprotocol.org/build)

---

## XLS Standards

| Standard | Role in Ward |
|----------|-------------|
| XLS-66 | Lending vault + loan lifecycle — Ward resolves defaults |
| XLS-20 | Policy NFT (taxon 281, `TF_BURNABLE`, non-transferable) |
| XLS-70 | KYC/AML credential NFT (taxon 282) |
| XLS-80 | Domain verification for vault operators |

---

## Multi-Chain Roadmap

| Chain | Status | Notes |
|-------|--------|-------|
| XRPL | **Live** | Altnet E2E confirmed, mainnet at XLS-66 launch |
| Flare EVM | Phase 1.5 | FDC enables XRPL state verification from Flare |
| Hedera | Phase 2 | HCS + HTS + Solidity contracts |
| Solana | Phase 3 | Anchor + Metaplex pNFT (Anodos Finance call June 12) |
| Stellar | Phase 4 | Soroban + Horizon SSE + SEP-0010 |
| XDC | Evaluating | XDC Network — XLS-66 compatibility assessment |

Integration plans: [docs/integration/](docs/integration/)

---

## Running Tests

```bash
# Python (317 unit tests)
pip install -r requirements.txt
python -m pytest test_ward.py -m "not integration" -v

# Rust (40 tests)
cd ward && cargo test

# TypeScript (45 tests)
cd sdk/typescript && npm install && npm test

# Lint
ruff check ward/ --select=E,F,W,I --ignore=E501
```

---

## Community

- **Discord:** [discord.gg/cGm9m5pEGK](https://discord.gg/cGm9m5pEGK)
- **XRPLF Discussion #474:** [github.com/XRPLF/XRPL-Standards/discussions/474](https://github.com/XRPLF/XRPL-Standards/discussions/474)
- **Website:** [wardprotocol.org](https://wardprotocol.org)
- **PyPI:** [pypi.org/project/ward-protocol](https://pypi.org/project/ward-protocol/)

---

## License

The Ward Protocol specification and SDK are MIT licensed.  
The hosted API at `api.wardprotocol.org` is subject to commercial terms.  
Ward Protocol is protocol software — not an insurance product, financial instrument, or regulated entity.

See [wardprotocol.org/terms](https://wardprotocol.org/terms)

---

`ward_signed = False — always.`
