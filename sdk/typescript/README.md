# Ward Protocol TypeScript SDK

> **`ward_signed = False — always.`**
> Ward constructs unsigned transactions. Institutions sign. The chain settles.

[![npm](https://img.shields.io/npm/v/@wardprotocol/sdk)](https://www.npmjs.com/package/@wardprotocol/sdk)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](../../LICENSE)

## Install

```bash
npm install @wardprotocol/sdk
```

## Quick Start

```typescript
import { WardClient, ClaimValidator } from '@wardprotocol/sdk';

const XRPL_RPC = 'https://s.altnet.rippletest.net:51234/';

// Validate a default claim — nine deterministic on-ledger checks
const validator = new ClaimValidator(XRPL_RPC);

const result = await validator.validateClaim({
  claimantAddress:  'rClaimant...',
  nftTokenId:       'A'.repeat(64),   // policy NFT token ID
  defaultedVault:   'rVault...',
  loanId:           'B'.repeat(64),   // XLS-66 loan object index
  poolAddress:      'rPool...',
});

console.log(result.approved);         // true | false
console.log(result.wardSigned);       // false — always
console.log(result.stepsPassed);      // 0–9
```

Ward never signs. The institution submits. XRPL settles.

## Status

| Metric | Value |
|--------|-------|
| Version | v0.2.6 |
| Tests passing | 634 (Python · Rust · TypeScript) |
| Open CVEs | 0 |
| ward_signed | `false` — always |

## Links

- **Website:** [wardprotocol.org](https://wardprotocol.org)
- **Assurance:** [wardprotocol.org/assurance](https://wardprotocol.org/assurance)
- **Docs:** [wardprotocol.org/docs](https://wardprotocol.org/docs)
- **Python SDK:** [pypi.org/project/ward-protocol](https://pypi.org/project/ward-protocol/)

## License

MIT
