import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Protocol — Documentation',
  description: 'SDK documentation, API reference, and integration guides for Ward Protocol v0.2.5.',
}

const modules = [
  { name: 'WardClient',        file: 'ward/client.py',        nsloc: '~100', desc: 'High-level SDK entrypoint. No wallet stored as instance attribute.' },
  { name: 'VaultMonitor',      file: 'ward/vault_monitor.py', nsloc: '~240', desc: 'WebSocket default detection. 3-ledger confirmation. Heartbeat reconnect.' },
  { name: 'ClaimValidator',    file: 'ward/validator.py',     nsloc: '~220', desc: '9-step on-chain claim validation. All state from XRPL ledger.' },
  { name: 'EscrowSettlement',  file: 'ward/settlement.py',    nsloc: '~160', desc: 'PREIMAGE-SHA-256 escrow lifecycle. Ward never receives preimage.' },
  { name: 'PoolHealthMonitor', file: 'ward/pool.py',          nsloc: '~175', desc: 'Coverage ratio enforcement. XRPL reserve accounting.' },
  { name: 'primitives',        file: 'ward/primitives.py',    nsloc: '~220', desc: 'validate_drops(), check_rate_limit(), make_preimage_condition(), submit_with_retry().' },
  { name: 'constants',         file: 'ward/constants.py',     nsloc: '~95',  desc: 'Single source of truth for all protocol constants. 100% test coverage.' },
]

const quickstart = `# Install
pip install ward-protocol==0.2.5

# Validate a claim (9 steps, all on-chain)
from ward import ClaimValidator

validator = ClaimValidator(url="https://s.altnet.rippletest.net:51234/")

result = await validator.validate_claim(
    claimant_address="rClaimantXXX...",
    nft_token_id="A" * 64,
    defaulted_vault="rVaultXXX...",
    loan_id="B" * 64,
    pool_address="rPoolXXX...",
)

print(result.approved)            # True
print(result.steps_passed)        # 9
print(result.claim_payout_drops)  # min(vault_loss, policy_coverage)`

const testCmd = `# Run test suite (317/317 Python passing)
pip install -r requirements.txt
python -m pytest test_ward.py -m "not integration" -v

# Rust modules
cd ward && cargo test`

export default function DocsPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-gold/20 bg-white px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs uppercase tracking-[.15em] text-ice2 mb-2 font-mono">Ward Protocol SDK — v0.2.5</div>
          <h1 className="font-condensed font-black text-5xl text-steel mb-3">Documentation</h1>
          <p className="text-sm text-sub max-w-2xl">
            SDK reference, module overview, and integration guides. All modules are independently auditable.
          </p>
          <div className="flex gap-3 mt-5">
            <span className="text-[10px] bg-[#fdf8ed] text-[#c8a94a] border border-gold/30 px-2.5 py-1 rounded font-mono font-bold">317/317 Tests</span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">Python 3.11+</span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">MIT License</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-12">

        {/* Use Cases callout */}
        <div className="bg-[#eff6ff] border border-blue-200 rounded-md p-4 mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-800 m-0">
            New to Ward Protocol? Start with the Use Cases — plain English scenarios showing Ward in action.
          </p>
          <Link href="/use-cases" className="text-sm text-blue-700 font-semibold hover:text-blue-900 transition-colors whitespace-nowrap no-underline">
            View Use Cases →
          </Link>
        </div>

        {/* Quickstart */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-[#c8a94a] mb-4">Quickstart</h2>
          <pre className="bg-steel text-ice text-[12px] leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre">
            {quickstart}
          </pre>
        </section>

        {/* Module reference */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-[#c8a94a] mb-2">Module Reference</h2>
          <p className="text-sm text-sub mb-5">Total nSLOC: ~2,148 Python + ~583 Rust</p>
          <div className="space-y-3">
            {modules.map(m => (
              <div key={m.name} className="bg-white border border-p2 rounded-md p-4 flex items-start gap-4">
                <code className="text-sm font-bold text-steel shrink-0 w-44 border-l-2 border-[#c8a94a] pl-2">{m.name}</code>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ice2 font-mono mb-1">{m.file} · {m.nsloc} nSLOC</div>
                  <div className="text-sm text-sub">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testing */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-[#c8a94a] mb-4">Testing</h2>
          <pre className="bg-steel text-ice text-[12px] leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre">
            {testCmd}
          </pre>
          <p className="text-sm text-sub mt-3">
            317 Python tests + 40 Rust tests + 45 TypeScript tests covering all 9 claim validation steps, all 15 attack vectors, VaultMonitor,
            EscrowSettlement, PoolHealthMonitor, and all primitives.
            Marked <code className="bg-p2 px-1 rounded text-xs">integration</code> tests require XRPL Mainnet access.
          </p>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-[#c8a94a] mb-4">Changelog</h2>
          {[
            {
              version: 'v0.2.5',
              date: 'June 2026',
              changes: [
                { type: 'Added', text: 'MultiInstitutionPool — shared capital, pro-rata loss distribution, admin access control' },
                { type: 'Added', text: 'register_pool_member() — unsigned AccountSet tx, ward_signed=False in memo payload' },
                { type: 'Changed', text: 'Step 6 now rejects when pool usable balance < vault loss (min_balance enforcement)' },
                { type: 'Fixed', text: 'asyncio.get_event_loop().run_until_complete() → asyncio.run() (pytest-asyncio 1.4.0 compatibility)' },
                { type: 'Changed', text: 'Python tests: 317/317 passing across Python 3.10 · 3.11 · 3.12' },
              ],
            },
            {
              version: 'v0.2.4',
              date: 'May 2026',
              changes: [
                { type: 'Changed', text: 'Test counts corrected — 317/317 Python · 40/40 Rust · 45/45 TypeScript' },
                { type: 'Added', text: 'Coverage sprint — chain_reader 100%, monitor 100%, tx_builder 100%, vault_monitor 99%' },
                { type: 'Changed', text: 'Python tests: 204/204 → 257/257 (92 new coverage tests)' },
                { type: 'Fixed', text: 'Headline typo corrected in README and PyPI description' },
              ],
            },
            {
              version: 'v0.2.3',
              date: 'May 2026',
              changes: [
                { type: 'Fixed', text: '11 code review findings — NFTokenBurn permission, Steps 7+8 real ledger queries, TxBuilder condition fields' },
                { type: 'Fixed', text: 'Coverage tracking redesigned — _coverage_registry with register/deregister methods' },
                { type: 'Fixed', text: 'loan_id 64-hex validation at validate_claim input boundary' },
                { type: 'Fixed', text: 'Rust health ratio hardcoded proxy removed — returns error when XLS-66 fields absent' },
                { type: 'Fixed', text: 'Rate limit dict eviction — empty entries cleaned up, 10K entry cap' },
                { type: 'Fixed', text: 'WardError raised on empty premium tx hash' },
                { type: 'Added', text: 'Rust EscrowBuilder audit memos — ward/claim-escrow format matching Python' },
                { type: 'Changed', text: 'xrpl-py updated to 4.5.0' },
                { type: 'Changed', text: 'Python tests: 165/165 → 204/204 → 257/257 · Rust tests: 40/40' },
              ],
            },
            {
              version: 'v0.2.2',
              date: 'May 2026',
              changes: [
                { type: 'Added', text: 'Rust VaultMonitor and EscrowSettlement modules' },
                { type: 'Added', text: '15 attack-vector mitigations (AV 2.1–2.15)' },
                { type: 'Added', text: 'Code4rena audit scope documentation' },
              ],
            },
          ].map(entry => (
            <div key={entry.version} className="mb-8 border border-p2 bg-white rounded-md p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-condensed font-black text-xl text-[#c8a94a]">{entry.version}</span>
                <span className="text-xs text-sub font-mono">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`shrink-0 font-mono text-xs px-1.5 py-0.5 rounded ${
                      c.type === 'Fixed' ? 'bg-[#fff3e0] text-[#b45309]' :
                      c.type === 'Added' ? 'bg-[#e8fff3] text-[#00994d]' :
                      'bg-panel text-sub'
                    }`}>{c.type}</span>
                    <span className="text-sub">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Links */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-[#c8a94a] mb-4">Resources</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'GitHub Repository',    href: 'https://github.com/wflores9/ward-protocol', ext: true },
              { label: 'PyPI Package',         href: 'https://pypi.org/project/ward-protocol/', ext: true },
              { label: 'Protocol Spec',        href: '/spec', ext: false },
              { label: 'Demo & Checklist',     href: '/demo', ext: false },
              { label: 'Code4rena Scope',      href: 'https://github.com/wflores9/ward-protocol/blob/main/docs/code4rena-scope.md', ext: true },
              { label: 'XRPL Standards',       href: 'https://github.com/XRPLF/XRPL-Standards', ext: true },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                target={l.ext ? '_blank' : undefined}
                rel={l.ext ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-2 text-sm text-sub hover:text-steel border border-p2 bg-white rounded-md px-4 py-3 transition-colors no-underline"
              >
                <span className="text-ice2">↗</span> {l.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
