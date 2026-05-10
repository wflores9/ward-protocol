import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Protocol — Specification',
  description: 'Technical specification for Ward Protocol: 9-step claim validation, VaultMonitor, EscrowSettlement, and all 15 attack-vector mitigations.',
}

const sections = [
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
    content: `Step 1   NFT existence & taxon (WARD_POLICY_TAXON = 281)
Step 2   Policy expiry — XRPL ledger close_time, never server clock
Step 3   Vault address binding — metadata vault == defaulted_vault
Step 4   LSF_LOAN_DEFAULT flag on LedgerEntry(index=loan_id)
Step 5   Vault loss > 0 drops
Step 6   Pool coverage breach — usable = balance − XRPL reserve ≥ 0
Step 7   Replay protection — NFT still live (burn-on-settlement)
Step 8   Claimant holds NFT — AccountNFTs(account=claimant_address)
Step 9   Pool solvency + rate limit (≤ 3/NFT/300 s, ratio ≥ 1.5×)`,
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
    content: `WARD_POLICY_TAXON       = 281      # XLS-20 NFT taxon for policy NFTs
WARD_CREDENTIAL_TAXON  = 282      # XLS-70 credential NFT taxon
TF_BURNABLE             = 0x00000001
TF_TRANSFERABLE         = 0x00000008  # deliberately ABSENT from policy NFTs
LSF_LOAN_DEFAULT        = 0x00010000
MIN_COVERAGE_RATIO      = 1.5
CLAIM_RATE_LIMIT_MAX    = 3
CLAIM_RATE_LIMIT_WINDOW_S = 300
MONITOR_HEARTBEAT_TIMEOUT_S = 60
XRPL_BASE_RESERVE_DROPS = 2_000_000
XRPL_OWNER_RESERVE_DROPS = 200_000
RIPPLE_EPOCH_OFFSET     = 946_684_800`,
  },
]

export default function SpecPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-p2 bg-white px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-2 font-mono">Ward Protocol v0.2.2</div>
          <h1 className="font-condensed font-black text-5xl text-steel mb-3">Protocol Specification</h1>
          <p className="text-[13px] text-sub max-w-2xl">
            Technical reference for Ward Protocol: architecture, 9-step claim validation,
            VaultMonitor, escrow settlement, and all 15 attack-vector mitigations.
          </p>
          <div className="flex gap-3 mt-5">
            <span className="text-[10px] bg-[#e8fff3] text-[#00994d] border border-green px-2.5 py-1 rounded font-mono font-bold">
              146/146 Tests
            </span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">
              SDK v0.2.2
            </span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">
              15 AVs Mitigated
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-[200px_1fr] gap-10 items-start">
        {/* TOC */}
        <nav className="sticky top-20 hidden md:block">
          <div className="text-[10px] uppercase tracking-widest text-sub mb-3">Contents</div>
          <ul className="space-y-1.5">
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[11px] text-sub hover:text-steel transition-colors no-underline block">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-p2">
            <Link href="/demo" className="text-[11px] text-ice2 hover:text-steel transition-colors no-underline">
              → Try Checklist
            </Link>
          </div>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(s => (
            <section key={s.id} id={s.id}>
              <h2 className="font-condensed font-black text-2xl text-steel mb-3">{s.title}</h2>
              <pre className="bg-steel text-ice text-[12px] leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre-wrap">
                {s.content}
              </pre>
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
                  className="flex items-center gap-2 text-[12px] text-sub hover:text-steel border border-p2 bg-white rounded-md px-4 py-3 transition-colors no-underline"
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
