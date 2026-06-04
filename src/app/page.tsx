import Link from 'next/link'

const flows = [
  { code: 'F·01', name: 'Vault Registration', status: 'LIVE' },
  { code: 'F·02', name: 'Credential Issuance', status: 'LIVE' },
  { code: 'F·03', name: 'Policy Purchase',     status: 'LIVE' },
  { code: 'F·04', name: 'Default Detection',   status: 'LIVE' },
  { code: 'F·05', name: 'Claim Validation',    status: 'XLS-66 MAINNET' },
  { code: 'F·06', name: 'Escrow Settlement',   status: 'XLS-66 MAINNET' },
]

const steps = [
  { n: 1, title: 'Vault Registration', body: 'Institution registers its XLS-66 vault. Ward confirms the vault object exists on the XRPL ledger via account_objects.' },
  { n: 2, title: 'Policy Purchase',    body: 'Depositor acquires coverage via a non-transferable XLS-20 NFT (taxon 281). Ward returns an unsigned NFTokenMint. Institution signs. XRPL settles.' },
  { n: 3, title: 'Vault Monitoring',   body: 'Ward monitors vault health via WebSocket. Events are hints — ledger state is always truth. 3-ledger confirmation window eliminates manipulation.' },
  { n: 4, title: 'Default Detection',  body: 'Health ratio below 1.5 confirmed across 3 consecutive ledger closes (~12 seconds). Single-block manipulation is structurally impossible.' },
  { n: 5, title: 'Claim Validation',   body: 'Nine deterministic checks run against live XRPL ledger state. No oracle. No human judgment. Every check is verifiable on-chain.' },
  { n: 6, title: 'Escrow Settlement',  body: 'Ward returns an unsigned EscrowCreate with PREIMAGE-SHA-256 (48-hour window). Institution signs. XRPL settles. ward_signed=False — always.' },
]

const quotes = [
  { text: 'The protocol is ahead of the compliance tooling.', attr: 'XRPL Zone Paris Working Group', role: 'April 14, 2026' },
  { text: 'Risks become more programmatic. Observable. Quantifiable. That kind of visibility is what larger institutions look for.', attr: 'Asheesh Birla, CEO Evernorth', role: 'XRPL Commons · April 2026' },
  { text: 'XLS-66 + Ward = risk-managed credit infrastructure institutions need before deploying serious capital.', attr: 'XRP Cipher Podcast', role: 'April 2026' },
  { text: 'In Ward We Trust.', attr: 'XRPL Community', role: 'April 2026' },
]

const statusRows: [string, React.ReactNode][] = [
  ['SDK Version', 'v0.2.5'],
  ['Unit Tests', <span style={{ color: 'var(--green)' }}>317 Python · 40 Rust · 45 TypeScript</span>],
  ['Coverage', 'chain_reader 100% · monitor 100% · tx_builder 100% · vault_monitor 99%'],
  ['On-Chain Transactions', '2 confirmed (XRPL Altnet) · F·03–F·05 pending XLS-66 mainnet'],
  ['External Dependencies', '0 — pure XRPL'],
  ['Ward Holds Keys', 'Never'],
  ['Authoritative State', 'XRPL Ledger'],
  ['Production Code', '2,148 lines'],
  ['XRPLF Standards', 'XLS-66 · XLS-70 · XLS-80 · XLS-20'],
]

const txns = [
  { step: '1 — Premium Payment',  type: 'Payment',       proves: 'Premium to pool',                hash: 'B756484C...3B8D7E' },
  { step: '2 — Policy NFT Mint',  type: 'NFTokenMint',   proves: 'Coverage issued (taxon 281)',    hash: '2800219A...E79E2CB' },
  { step: '3 — Escrow Create',    type: 'EscrowCreate',  proves: 'Funds locked PREIMAGE-SHA-256',  hash: 'Pending F·05' },
  { step: '4 — Escrow Finish',    type: 'EscrowFinish',  proves: 'Payout released with preimage',  hash: 'Pending F·05' },
  { step: '5 — Policy NFT Burn',  type: 'NFTokenBurn',   proves: 'Replay protection confirmed',    hash: 'Pending F·05' },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <div className="hero-wrap">
        <div className="hero">
          <div className="hero-content">
            <p className="hero-eyebrow">DETERMINISTIC · ON-CHAIN · ORACLE-FREE</p>
            <h1>Deterministic default resolution for <em>on-chain lending.</em></h1>
            <p className="hero-body">
              When a borrower defaults, Ward Protocol defines exactly what happens.
              Nine on-ledger checks. No oracle. No human judgment. No Ward signature — ever.
            </p>
            <div className="hero-actions">
              <Link href="/spec" className="btn-primary">View Specification →</Link>
              <Link href="/demo" className="btn-ghost">Try Demo →</Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <span className="hero-card-label">WARD · v0.2.5 · ALTNET</span>
              <span className="live-badge"><span className="live-dot" />LIVE</span>
            </div>
            <div className="invariant-box">
              <div className="invariant-label">Core Invariant</div>
              ward_signed = False
            </div>
            <ul className="flow-list">
              {flows.map(f => (
                <li className="flow-item" key={f.code}>
                  <span className="flow-code">{f.code}</span>
                  <span className="flow-name">{f.name}</span>
                  <span className="flow-status" style={f.status !== 'LIVE' ? { color: '#c8a94a' } : undefined}>{f.status}</span>
                </li>
              ))}
            </ul>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-val" style={{ color: '#c8a94a' }}>317/317</span>
                <span className="hero-stat-lbl">Tests</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val" style={{ color: '#c8a94a' }}>FALSE</span>
                <span className="hero-stat-lbl">ward_signed</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val" style={{ color: '#c8a94a' }}>3</span>
                <span className="hero-stat-lbl">Confirmation Window</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className="social-proof">
        <span className="sp-label">Active on</span>
        <div className="sp-divider" />
        <span className="sp-item">XRPL Altnet</span>
        <div className="sp-divider" />
        <span className="sp-item">XRPLF Standards #474</span>
        <div className="sp-divider" />
        <span className="sp-item">PyPI · ward-protocol</span>
        <div className="sp-divider" />
        <span className="sp-item">Discord Community</span>
        <div className="sp-divider" />
        <span className="sp-item">317 Tests Passing</span>
      </div>

      {/* THE QUESTION */}
      <section className="page-section question-section">
        <div className="section-inner">
          <p className="eyebrow border-l-2 border-[#c8a94a] pl-3">The problem</p>
          <h2>What happens when the borrower doesn&apos;t pay?</h2>
          <p>Every institution deploying capital into on-chain lending will eventually ask this question. Today, there is no standard answer. Every protocol builds their own — or ignores the risk entirely.</p>
          <p>Ward Protocol is the answer. The open specification that defines exactly what happens on default. Deterministic. Auditable. On-chain.</p>
          <p className="question-answer">Ward Protocol is that missing layer.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="page-section how-section">
        <div className="section-inner">
          <p className="eyebrow">How it works</p>
          <h2>Six steps. Fully on-chain.</h2>
          <p className="section-sub">No off-chain oracle. No human judgment. Pure XRPL ledger state at every step.</p>
          <div className="steps-grid">
            {steps.map(s => (
              <div className="step-card" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVARIANT */}
      <section className="page-section invariant-section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <p className="eyebrow">The core invariant</p>
          <h2>ward_signed = False — always</h2>
          <p className="section-sub" style={{ margin: '0 auto 0', color: 'rgba(255,255,255,0.65)' }}>
            Ward constructs unsigned transactions. Institutions sign. XRPL settles. Ward is never a counterparty.
          </p>
          <div className="code-block">
            <span className="code-comment"># Ward NEVER does this:</span><br />
            await submit_and_wait(tx, client, <span className="code-blue">ward_wallet</span>)&nbsp;&nbsp;<span className="code-comment"># Ward has no wallet</span><br /><br />
            <span className="code-comment"># Ward ALWAYS does this:</span><br />
            return UnsignedTransaction(<br />
            &nbsp;&nbsp;&nbsp;&nbsp;tx_dict=tx.to_dict(),<br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-gold">ward_signed</span>=<span className="code-green">False</span><br />
            )<br />
            <span className="code-comment"># Institution signs and submits with their own wallet</span>
          </div>
          <div className="gold-callout">
            The gold line holds. This invariant is enforced at the architecture level across every module.
            No Ward class stores a wallet. No Ward method signs a transaction.
          </div>
        </div>
      </section>

      {/* LICENSING */}
      <section className="page-section" style={{ background: 'var(--white)' }}>
        <div className="section-inner">
          <p className="eyebrow">Licensing</p>
          <h2>One specification. Three tiers.</h2>
          <p className="section-sub">
            Ward Protocol is pre-mainnet. All tier pricing is confirmed at XLS-66 mainnet launch.
            Reach out early to discuss your use case and secure pilot access.
          </p>
          <div style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
            <p style={{ fontSize: 15, color: '#2563eb', margin: 0, fontWeight: 500 }}>
              Pricing coming soon — announced at XLS-66 mainnet launch.{' '}
              <a href="mailto:wflores@wardprotocol.org" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}>Contact us</a> for early institutional access.
            </p>
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-tier">Developer</div>
              <div className="price-sub">For builders on XRPL</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Ward Protocol SDK (Python + TypeScript)</li>
                <li>Altnet sandbox access</li>
                <li>Starter repo + full documentation</li>
                <li>XRPLF Discussion #474</li>
                <li>Community Discord support</li>
              </ul>
              <a href="https://pypi.org/project/ward-protocol/" target="_blank" rel="noopener noreferrer" className="btn-outline-navy">Get Started →</a>
            </div>
            <div className="price-card">
              <div className="price-tier">Starter</div>
              <div className="price-sub">For teams deploying to mainnet</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Ward Protocol SDK access</li>
                <li>Python, TypeScript, Java examples</li>
                <li>Altnet integration out of the box</li>
                <li>XRPLF Discussion #474</li>
                <li>Email support</li>
              </ul>
              <a href="https://tally.so/r/VLDbBE" target="_blank" rel="noopener noreferrer" className="btn-outline-navy">Get in Touch →</a>
            </div>
            <div className="price-card">
              <div className="price-tier">Standard</div>
              <div className="price-sub">For institutional integrations</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Hosted API at api.wardprotocol.org</li>
                <li>X-Institution-Key authentication</li>
                <li>Onboarding session included</li>
                <li>Ward-Conformant certification path</li>
                <li>99.9% uptime SLA</li>
              </ul>
              <a href="https://cal.com/wardprotocol/30min" target="_blank" rel="noopener noreferrer" className="btn-navy">Book a Call →</a>
            </div>
            <div className="price-card dark">
              <div className="price-tier">Enterprise</div>
              <div className="price-sub" style={{ color: 'rgba(255,255,255,0.45)' }}>For regulated institutions</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>White-label implementation</li>
                <li>Custom SLA and dedicated support</li>
                <li>Legal opinion letter support</li>
                <li>Direct integration engineering</li>
                <li>Priority audit coordination</li>
              </ul>
              <a href="https://cal.com/wardprotocol/30min" target="_blank" rel="noopener noreferrer" className="btn-white">Book a Call →</a>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTES */}
      <section className="page-section quotes-section">
        <div className="section-inner">
          <p className="eyebrow" style={{ color: '#c8a94a' }}>Community signal</p>
          <h2>What the ecosystem is saying</h2>
          <p className="section-sub">Unprompted commentary from builders and observers in the XRPL ecosystem.</p>
          <div className="quotes-grid">
            {quotes.map(q => (
              <div className="quote-card" key={q.attr + q.role}>
                <p className="quote-text">&ldquo;{q.text}&rdquo;</p>
                <div className="quote-attr">{q.attr}</div>
                <div className="quote-role">{q.role}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-300)', marginTop: 24, textAlign: 'center' }}>
            These are independent comments, not formal endorsements.
          </p>
        </div>
      </section>

      {/* STATUS */}
      <section className="page-section status-section">
        <div className="section-inner">
          <p className="eyebrow">Current status</p>
          <h2>Built on XRPL · Mainnet-Ready at XLS-66 Launch</h2>
          <table className="status-table">
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              {statusRows.map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
          <table className="tx-table">
            <thead><tr><th>Step</th><th>Transaction Type</th><th>Proves</th><th>Hash</th></tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.hash}>
                  <td>{t.step}</td>
                  <td>{t.type}</td>
                  <td className="tx-proves">{t.proves}</td>
                  <td className="tx-hash">{t.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* WHY WARD */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-xs uppercase tracking-[.15em] text-[#c8a94a] mb-3 font-mono">Why Ward</div>
          <h2 className="font-condensed font-black text-4xl text-steel mb-6">Designed out of the equation.</h2>
          <p className="text-sub text-lg leading-relaxed mb-6">
            Most infrastructure wants to be in the middle. Ward is built to be invisible. We never hold keys, never co-sign transactions, never act as a counterparty. When a vault defaults, Ward evaluates the conditions and returns an unsigned transaction. The institution signs. The chain settles. Ward was never there.
          </p>
          <div className="border-l-4 border-[#c8a94a] pl-4 text-left inline-block">
            <code className="text-[#c8a94a] font-mono text-lg font-bold">ward_signed = False — always.</code>
          </div>
        </div>
      </section>

      {/* NINE ON-LEDGER CHECKS */}
      <section className="py-20 bg-steel border-t-4 border-[#c8a94a]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[.15em] text-[#c8a94a] mb-3 font-mono">Nine On-Ledger Checks</div>
            <h2 className="font-condensed font-black text-4xl text-ice">Every default. The same answer.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'Policy NFT Verified', desc: 'Taxon 281, non-transferable' },
              { n: '02', title: 'Policy Not Expired', desc: 'Checked against ledger close_time' },
              { n: '03', title: 'Vault Address Match', desc: 'NFT metadata verified on-chain' },
              { n: '04', title: 'Default Flag Confirmed', desc: 'LSF_LOAN_DEFAULT set on-chain' },
              { n: '05', title: 'Vault Loss > Zero', desc: 'Outstanding loan value confirmed' },
              { n: '06', title: 'Pool Coverage Available', desc: 'Reserve balance checked' },
              { n: '07', title: 'NFT Still Live', desc: 'Not previously burned' },
              { n: '08', title: 'Claimant Holds NFT', desc: 'Ownership verified on-chain' },
              { n: '09', title: 'Pool Solvent', desc: 'Rate limit and solvency clear' },
            ].map((step) => (
              <div key={step.n} className="bg-[#0a1828] border border-[#1a3050] rounded-lg p-5">
                <div className="text-[#a8c5e8] font-mono text-sm font-bold mb-2">{step.n}</div>
                <div className="text-white font-bold text-base mb-1">{step.title}</div>
                <div className="text-[#6a7d90] text-sm">{step.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-[#6a7d90] text-sm mt-8 font-mono">
            All nine must pass. Any failure returns a verifiable rejection reason — on-chain.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[.15em] text-[#c8a94a] mb-3 font-mono">FAQ</div>
            <h2 className="font-condensed font-black text-4xl text-steel">Common questions.</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Does Ward hold any signing keys?', a: 'Never. ward_signed = False is a founding architectural constraint. Ward constructs unsigned transactions. Institutions sign. The chain settles. Ward has no technical capability to move funds.' },
              { q: 'Does Ward use oracles?', a: 'No. All nine validation checks read directly from on-chain ledger state. No external price feeds, no off-chain APIs, no trust dependencies.' },
              { q: "What happens if Ward\'s API goes down?", a: 'The on-chain validation logic is open-source and can be run locally. The hosted API at api.wardprotocol.org provides convenience — not dependency. The protocol itself is independent of Ward Labs infrastructure.' },
              { q: 'Which chains does Ward support?', a: 'Ward Protocol is built on XRPL and is chain-agnostic by design. Mainnet at XLS-66 launch. Multi-chain ports (Flare, Solana, Hedera) are in the integration roadmap.' },
              { q: 'How is Ward different from a liquidation bot?', a: 'Liquidation bots are reactive, oracle-dependent, and application-layer. Ward is deterministic, oracle-free, and infrastructure-layer. They solve different problems — liquidation bots execute after a decision, Ward defines what the decision is.' },
              { q: 'What does Ward-Conformant mean?', a: "A Ward-Conformant protocol has passed Ward\'s conformance review — confirming that its vault structure, policy certificates, and settlement flow meet the Ward Protocol specification. It signals to institutional depositors that default resolution is deterministic and auditable." },
            ].map((item, i) => (
              <details key={i} className="group border border-[#e0e8f0] rounded-lg">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-bold text-steel text-base">{item.q}</span>
                  <span className="text-[#c8a94a] font-bold text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-sub text-sm leading-relaxed border-l-4 border-[#c8a94a] ml-5">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="page-section cta-section">
        <div className="section-inner">
          <h2>Ready to add default protection to your vault?</h2>
          <p>Ward Protocol is free to implement. The specification is open. The rails are yours.</p>
          <div className="cta-buttons">
            <Link href="/spec" className="btn-primary">View Specification →</Link>
            <a href="mailto:wflores@wardprotocol.org" className="btn-ghost">Contact Us</a>
          </div>
        </div>
      </section>
    </>
  )
}
