# Ward Protocol TypeScript SDK

> `ward_signed = False — always.`
> Ward constructs unsigned transactions. Institutions sign. XRPL settles.

## Install

```bash
npm install @wardprotocol/sdk
```

## Quick Start

```typescript
import { WardClient, ClaimValidator } from '@wardprotocol/sdk';

const validator = new ClaimValidator({
  url: 'https://s.altnet.rippletest.net:51234/'
});

const result = await validator.validateClaim({
  claimantAddress: 'rClaimant...',
  nftTokenId: 'AAA...',
  defaultedVault: 'rVault...',
  poolAddress: 'rPool...'
});

console.log(result.approved);    // true
console.log(result.stepsPassed); // 9
console.log(result.wardSigned);  // false — always
```

## Stats

- 634 automated tests passing
- 92% critical path coverage
- 0 open CVEs
- ward_signed = False enforced at 4 layers

## Links

- [wardprotocol.org](https://wardprotocol.org)
- [Assurance](https://wardprotocol.org/assurance)
- [Docs](https://wardprotocol.org/build)
- [PyPI](https://pypi.org/project/ward-protocol/)

## License

MIT — SDK is free. Mainnet API requires commercial license.
Contact: team@wardprotocol.org
