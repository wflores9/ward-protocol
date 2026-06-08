'use client'

import { useState } from 'react'

const FLOWS = [
  {
    id:    'F01',
    title: 'F·01 — Vault Registration',
    desc:  'Register an XLS-66 vault. Ward returns an unsigned NFTokenMint; institution signs.',
    code:  `from ward import WardClient
from xrpl.wallet import Wallet

client = WardClient()
wallet = Wallet.from_seed(seed)   # institution holds key

# Ward builds unsigned tx — ward_signed = False
unsigned_tx = await client.register_vault(
    institution_address=wallet.classic_address,
    collateral_currency="XRP",
    min_collateral_ratio=1.5,
)

assert "TxnSignature" not in unsigned_tx
# Institution signs and submits
result = await submit_and_wait(unsigned_tx, xrpl_client, wallet)`,
  },
  {
    id:    'F02',
    title: 'F·02 — Policy Purchase',
    desc:  'Mint a Ward policy NFT (taxon=281, TF_BURNABLE, no TF_TRANSFERABLE).',
    code:  `from ward import WardClient
from ward.constants import WARD_POLICY_TAXON, TF_TRANSFERABLE

client = WardClient()

# Ward builds unsigned NFTokenMint
unsigned_tx = await client.purchase_policy(
    vault_address=vault_addr,
    depositor_address=wallet.classic_address,
    coverage_drops=500_000_000,   # 500 XRP
    duration_seconds=2_592_000,   # 30 days
)

assert unsigned_tx["NFTokenTaxon"] == WARD_POLICY_TAXON  # 281
assert not (unsigned_tx["Flags"] & TF_TRANSFERABLE)       # not transferable
assert "TxnSignature" not in unsigned_tx                   # ward_signed = False`,
  },
  {
    id:    'F03',
    title: 'F·03 — Vault Monitor',
    desc:  'Subscribe to XRPL ledger stream. 3-ledger confirmation before VerifiedDefault fires.',
    code:  `from ward import VaultMonitor, VerifiedDefault

monitor = VaultMonitor(
    vault_addresses=["rVaultXXX..."],
    websocket_url="wss://s.altnet.rippletest.net:51233/",
    confirm_count=3,     # 3-ledger confirmation
)

@monitor.on_verified_default
async def handle(event: VerifiedDefault):
    print(f"Default confirmed: {event.vault_address}")
    print(f"Health ratio:      {event.health_ratio:.4f}")
    print(f"Confirmed ledger:  {event.confirmed_ledger}")
    # Trigger claim validation → escrow settlement

await monitor.run()   # reconnects on disconnect`,
  },
  {
    id:    'F04',
    title: 'F·04 — Claim Validation',
    desc:  '9-step on-chain claim validation. All state sourced from XRPL ledger.',
    code:  `from ward import ClaimValidator

validator = ClaimValidator(url="https://s.altnet.rippletest.net:51234/")

result = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="A" * 64,         # 64-char hex
    defaulted_vault="rVaultXXX...",
    loan_id="B" * 64,
    pool_address="rPoolXXX...",
)

print(result.approved)           # True / False
print(result.steps_passed)       # 0—9
print(result.claim_payout_drops) # min(vault_loss, coverage)`,
  },
  {
    id:    'F05',
    title: 'F·05 — Escrow Settlement',
    desc:  'Claimant holds preimage. Ward receives condition_hex only. ward_signed = False.',
    code:  `from ward.primitives import generate_claim_preimage, make_preimage_condition

# Claimant generates preimage locally
preimage = generate_claim_preimage()   # 32 random bytes
condition_hex, fulfillment_hex = make_preimage_condition(preimage)

# Ward receives condition_hex ONLY — never the preimage
unsigned_create = await client.create_claim_escrow(
    pool_address=pool_addr,
    claimant_address=wallet.classic_address,
    amount_drops=payout,
    condition_hex=condition_hex,   # ward_signed = False
)

# Pool signs EscrowCreate; claimant signs EscrowFinish
await submit_and_wait(EscrowCreate.from_dict(unsigned_create), client, pool_wallet)
await submit_and_wait(EscrowFinish(..., fulfillment_hex=fulfillment_hex), client, wallet)`,
  },
]

export default function FlowRunner() {
  const [active, setActive] = useState(0)
  const flow = FLOWS[active]

  return (
    <div className="bg-white border border-p2 rounded-md overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-p2 bg-panel">
        {FLOWS.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setActive(i)}
            className={`px-4 py-3 text-sm font-mono whitespace-nowrap border-r border-p2 transition-colors ${
              i === active ? 'bg-white text-[#c8a94a] font-bold border-b-2 border-b-[#c8a94a] -mb-px' : 'text-sub hover:text-[#c8a94a]'
            }`}
          >
            {f.id}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-sans font-black text-xl text-steel mb-1">{flow.title}</h3>
        <p className="text-sm text-sub mb-4">{flow.desc}</p>
        <pre className="bg-steel rounded-md p-4 text-sm text-ice leading-relaxed overflow-x-auto font-mono whitespace-pre">
          {flow.code}
        </pre>
      </div>
    </div>
  )
}
