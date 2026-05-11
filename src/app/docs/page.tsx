import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Protocol — Documentation',
  description: 'SDK documentation, API reference, and integration guides for Ward Protocol v0.2.2.',
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
pip install ward-protocol==0.2.2

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

const testCmd = `# Run test suite (165/165 Python · 40/40 Rust)
pip install -r requirements.txt
python -m pytest test_ward.py -m "not integration" -v

# Rust modules
cd ward && cargo test`

export default function DocsPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-p2 bg-white px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-2 font-mono">Ward Protocol SDK — v0.2.2</div>
          <h1 className="font-condensed font-black text-5xl text-steel mb-3">Documentation</h1>
          <p className="text-[13px] text-sub max-w-2xl">
            SDK reference, module overview, and integration guides. All modules are independently auditable.
          </p>
          <div className="flex gap-3 mt-5">
            <span className="text-[10px] bg-[#e8fff3] text-[#00994d] border border-green px-2.5 py-1 rounded font-mono font-bold">165/165 Tests</span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">Python 3.11+</span>
            <span className="text-[10px] bg-panel border border-border text-sub px-2.5 py-1 rounded font-mono">MIT License</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-12">

        {/* Quickstart */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-steel mb-4">Quickstart</h2>
          <pre className="bg-steel text-ice text-[12px] leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre">
            {quickstart}
          </pre>
        </section>

        {/* Module reference */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-steel mb-2">Module Reference</h2>
          <p className="text-[12px] text-sub mb-5">Total nSLOC: ~1,565 Python + ~583 Rust</p>
          <div className="space-y-3">
            {modules.map(m => (
              <div key={m.name} className="bg-white border border-p2 rounded-md p-4 flex items-start gap-4">
                <code className="text-[13px] font-bold text-steel shrink-0 w-44">{m.name}</code>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-ice2 font-mono mb-1">{m.file} · {m.nsloc} nSLOC</div>
                  <div className="text-[12px] text-sub">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testing */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-steel mb-4">Testing</h2>
          <pre className="bg-steel text-ice text-[12px] leading-relaxed rounded-md p-5 overflow-x-auto font-mono whitespace-pre">
            {testCmd}
          </pre>
          <p className="text-[12px] text-sub mt-3">
            165 Python + 40 Rust tests covering all 9 claim validation steps, all 15 attack vectors, VaultMonitor,
            EscrowSettlement, PoolHealthMonitor, and all primitives.
            Marked <code className="bg-p2 px-1 rounded text-[11px]">integration</code> tests require XRPL Mainnet access.
          </p>
        </section>

        {/* Links */}
        <section>
          <h2 className="font-condensed font-black text-3xl text-steel mb-4">Resources</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'PyPI Package',         href: 'https://pypi.org/project/ward-protocol/', ext: true },
              { label: 'Protocol Spec',        href: '/spec', ext: false },
              { label: 'Demo & Checklist',     href: '/demo', ext: false },
              { label: 'XRPLF Discussion #474', href: 'https://github.com/XRPLF/XRPL-Standards/discussions/474', ext: true },
              { label: 'XRPL Standards',       href: 'https://github.com/XRPLF/XRPL-Standards', ext: true },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                target={l.ext ? '_blank' : undefined}
                rel={l.ext ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-2 text-[12px] text-sub hover:text-steel border border-p2 bg-white rounded-md px-4 py-3 transition-colors no-underline"
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
