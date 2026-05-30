import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Protocol — Specification',
  description: 'Technical specification for Ward Protocol: 9-step claim validation, VaultMonitor, EscrowSettlement, and all 15 attack-vector mitigations.',
}

const CLAIM_STEPS = [
  { n: 1, text: 'NFT existence & taxon (WARD_POLICY_TAXON = 281)' },
  { n: 2, text: 'Policy expiry — XRPL ledger close_time, never server clock' },
  { n: 3, text: 'Vault address binding — metadata vault == defaulted_vault' },
  { n: 4, text: 'LSF_LOAN_DEFAULT flag on LedgerEntry(index=loan_id)' },
  { n: 5, text: 'Vault loss > 0 drops' },
  { n: 6, text: 'Pool coverage breach — usable = balance − XRPL reserve ≥ 0' },
  { n: 7, text: 'Replay protection — NFT still live (burn-on-settlement)' },
  { n: 8, text: 'Claimant holds NFT — AccountNFTs(account=claimant_address)' },
  { n: 9, text: 'Pool solvency + rate limit (≤ 3/NFT/300 s, ratio ≥ 1.5×)' },
]

const CONSTANTS = [
  { name: 'WARD_POLICY_TAXON',           value: ' = 281',          comment: '      # XLS-20 NFT taxon for policy NFTs' },
  { name: 'WARD_CREDENTIAL_TAXON',       value: ' = 282',          comment: '      # XLS-70 credential NFT taxon' },
  { name: 'TF_BURNABLE',                 value: ' = 0x00000001',   comment: '' },
  { name: 'TF_TRANSFERABLE',             value: ' = 0x00000008',   comment: '  # deliberately ABSENT from policy NFTs' },
  { name: 'LSF_LOAN_DEFAULT',            value: ' = 0x00010000',   comment: '' },
  { name: 'MIN_COVERAGE_RATIO',          value: ' = 1.5',          comment: '' },
  { name: 'CLAIM_RATE_LIMIT_MAX',        value: ' = 3',            comment: '' },
  { name: 'CLAIM_RATE_LIMIT_WINDOW_S',   value: ' = 300',          comment: '' },
  { name: 'MONITOR_HEARTBEAT_TIMEOUT_S', value: ' = 60',           comment: '' },
  { name: 'XRPL_BASE_RESERVE_DROPS',    value: ' = 2_000_000',    comment: '' },
  { name: 'XRPL_OWNER_RESERVE_DROPS',   value: ' = 200_000',      comment: '' },
  { name: 'RIPPLE_EPOCH_OFFSET',         value: ' = 946_684_800',  comment: '' },
]

const sections: Array<{ id: string; title: string; gold?: boolean; content: string | null }> = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Ward Protocol is an open specification and SDK for deterministic default protection
on XLS-66 institutional lending vaults on the XRP Ledger.

Core invariant: ward_signed = False
Ward constructs unsigned transactions. Institutions sign; XRPL settles.
Ward never holds, touches, or stores private keys.`,
  },
  {
    id: 'architecture',
    title: '2. Architecture',
    gold: true,
    content: `Five modules:

  Module 1 — WardClient         High-level SDK entrypoint
  Module 2 — VaultMonitor       WebSocket default detection (3-ledger confirmation)
  Module 3 — ClaimValidator     9-step on-chain claim validation
  Module 4 — EscrowSettlement   PREIMAGE-SHA-256 escrow lifecycle
  Module 5 — PoolHealthMonitor  Coverage ratio + reserve accounting

Shared: ward/primitives.py, ward/constants.py, ward/tx_builder.py`,
  },
  {
    id: 'claim-validation',
    title: '3. 9-Step Claim Validation',
    gold: true,
    content: null,
  },
  {
    id: 'vault-monitor',
    title: '4. VaultMonitor',
    content: `Subscribes to XRPL ledger stream via wss:// (TLS required).

Default detection:
  1. WebSocket transaction message received (hint only)
  2. _verify_default_on_chain(): LedgerEntry(index=loan_id) via independent RPC
  3. 3 consecutive ledger closes with LSF_LOAN_DEFAULT set → VerifiedDefault

Reconnect: exponential backoff (1 s → 60 s max)
Heartbeat:  reconnects if no ledger event in MONITOR_HEARTBEAT_TIMEOUT_S (60 s)
URL allow-list: ALLOWED_WS_URLS — rejects unknown or non-TLS endpoints`,
  },
  {
    id: 'escrow',
    title: '5. Escrow Settlement',
    content: `PREIMAGE-SHA-256 (RFC 3230 / IETF Crypto-Conditions):

  1. Claimant: preimage = secrets.token_bytes(32)
  2. Claimant: condition_hex, fulfillment_hex = make_preimage_condition(preimage)
  3. Claimant sends condition_hex to Ward API — preimage never transmitted
  4. Ward builds unsigned EscrowCreate (pool → claimant, condition=condition_hex)
  5. Pool institution signs + submits EscrowCreate
  6. Ward builds unsigned EscrowFinish (fulfillment=fulfillment_hex)
  7. Claimant signs + submits EscrowFinish
  8. Policy NFT burned (NFTokenBurn) — replay protection

ward_signed = False at every step`,
  },
  {
    id: 'attack-vectors',
    title: '6. Attack Vector Mitigations',
    gold: true,
    content: `AV 2.1   Policy Forgery         — NFTokenTaxon == 281 enforced at step 1
AV 2.2   Replay / Double-Spend  — NFT burned on settlement; step 1 re-checks
AV 2.3   Policy Transfer        — TF_TRANSFERABLE (0x8) absent; TF_BURNABLE only
AV 2.4   Signal Manipulation    — Independent LedgerEntry RPC on every event
AV 2.5   Clock Manipulation     — XRPL ledger close_time; no time.time()
AV 2.6   Front-Running Escrow   — Ward never receives or stores preimage
AV 2.7   Monitor Spoofing       — wss:// + ALLOWED_WS_URLS allow-list
AV 2.8   Pool Drainage          — Step 6 + Step 9 dual solvency checks
AV 2.9   Coverage Ratio Manip   — Health ratio re-fetched from ledger at step 4
AV 2.10  Address Injection       — validate_xrpl_address() at every API boundary
AV 2.11  Key Exfiltration        — WardClient stores no wallet; per-call only
AV 2.12  Rate Limit Bypass       — Sliding window: 3 attempts/NFT/300 s
AV 2.13  NFT Taxon Spoofing      — _WRONG_TAXON sentinel; taxon check at step 1
AV 2.14  Drops Unit Confusion    — validate_drops() rejects floats, bools, negatives
AV 2.15  Silent Network Failure  — asyncio.wait_for heartbeat; 60 s timeout`,
  },
  {
    id: 'constants',
    title: '7. Protocol Constants',
    gold: true,
    content: null,
  },
]

export default function SpecPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-gold/20 bg-white px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs uppercase tracking-[.15em] text-ice2 mb-2 font-mono">Ward Protocol v0.2.4</div>
          <h1 className="font-condensed font-black text-5xl text-steel mb-3">Protocol Specification</h1>
          <p className="text-sm text-sub max-w-2xl">
            Technical reference for Ward Protocol: architecture, 9-step claim validation,
            VaultMonitor, escrow settlement, and all 15 attack-vector mitigations.
          </p>
          <div className="flex gap-3 mt-5">
            <span className="text-xs bg-[#fdf8ed] text-[#c8a94a] border border-gold/30 px-2.5 py-1 rounded font-mono font-bold">
              257/257 Python · 40/40 Rust · 45/45 TypeScript
            </span>
            <span className="text-xs bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">
              SDK v0.2.4
            </span>
            <span className="text-xs bg-[#fdf8ed] text-[#c8a94a] border border-gold/30 px-2.5 py-1 rounded font-mono">
              15 AVs Mitigated
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-[200px_1fr] gap-10 items-start">
        {/* TOC */}
        <nav className="sticky top-20 hidden md:block">
          <div className="text-xs uppercase tracking-widest text-sub mb-3">Contents</div>
          <ul className="space-y-1.5">
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-xs text-sub hover:text-steel transition-colors no-underline block">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-p2">
            <Link href="/demo" className="text-xs text-ice2 hover:text-steel transition-colors no-underline">
              → Try Checklist
            </Link>
          </div>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(s => (
            <section key={s.id} id={s.id}>
              <h2 className={`font-condensed font-black text-2xl mb-3 ${s.gold ? 'text-[#c8a94a]' : 'text-steel'}`}>
                {s.title}
              </h2>
              {s.id === 'claim-validation' ? (
                <div className="bg-steel rounded-md p-5 overflow-x-auto font-mono text-xs leading-relaxed">
                  {CLAIM_STEPS.map(step => (
                    <div key={step.n} className="flex gap-2 mb-1">
                      <span className="text-[#c8a94a] shrink-0 w-14">Step {step.n}</span>
                      <span className="text-ice">{step.text}</span>
                    </div>
                  ))}
                </div>
              ) : s.id === 'constants' ? (
                <div className="bg-steel rounded-md p-5 overflow-x-auto font-mono text-xs leading-relaxed">
                  {CONSTANTS.map(c => (
                    <div key={c.name} className="flex mb-0.5">
                      <span className="text-[#c8a94a] shrink-0 min-w-[28ch]">{c.name}</span>
                      <span className="text-ice">{c.value}</span>
                      {c.comment && <span className="text-dim">{c.comment}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="bg-steel text-ice text-xs leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre-wrap">
                  {s.content}
                </pre>
              )}
            </section>
          ))}

          <section id="links">
            <h2 className="font-condensed font-black text-2xl text-steel mb-3">8. Resources</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['GitHub Repository',      'https://github.com/wflores9/ward-protocol'],
                ['Python SDK (PyPI)',       'https://pypi.org/project/ward-protocol/'],
                ['XRPL XLS-66 Standard',   'https://github.com/XRPLF/XRPL-Standards'],
                ['Code4rena Audit Scope',  '/docs'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-2 text-sm text-sub hover:text-steel border border-p2 bg-white rounded-md px-4 py-3 transition-colors no-underline"
                >
                  <span className="text-ice2">↗</span> {label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
