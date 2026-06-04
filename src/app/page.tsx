import Link from 'next/link'
import React from 'react'

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
  { n: 3, title: 'Vault Monitoring',   body: 'Ward monitors vault health via WebSocket. Events are hints "" ledger state is always truth. 3-ledger confirmation window eliminates manipulation.' },
  { n: 4, title: 'Default Detection',  body: 'Health ratio below 1.5 confirmed across 3 consecutive ledger closes (~12 seconds). Single-block manipulation is structurally impossible.' },
  { n: 5, title: 'Claim Validation',   body: 'Nine deterministic checks run against live XRPL ledger state. No oracle. No human judgment. Every check is verifiable on-chain.' },
  { n: 6, title: 'Escrow Settlement',  body: 'Ward returns an unsigned EscrowCreate with PREIMAGE-SHA-256 (48-hour window). Institution signs. XRPL settles. ward_signed=False "" always.' },
]

const quotes = [
  { text: 'The protocol is ahead of the compliance tooling.', attr: 'XRPL Zone Paris Working Group', role: 'April 14, 2026' },
  { text: 'Risks become more programmatic. Observable. Quantifiable. That kind of visibility is what larger institutions look for.', attr: 'Asheesh Birla, CEO Evernorth', role: 'XRPL Commons · April 2026' },
  { text: 'XLS-66 + Ward = risk-managed credit infrastructure institutions need before deploying serious capital.', attr: 'XRP Cipher Podcast', role: 'April 2026' },
  { text: 'In Ward We Trust.', attr: 'XRPL Community', role: 'April 2026' },
]

const validationSteps = [
  { n: '01', title: 'Policy NFT Verified', desc: 'Taxon 281, non-transferable' },
  { n: '02', title: 'Policy Not Expired', desc: 'Checked against ledger close_time' },
  { n: '03', title: 'Vault Address Match', desc: 'NFT metadata verified on-chain' },
  { n: '04', title: 'Default Flag Confirmed', desc: 'LSF_LOAN_DEFAULT set on-chain' },
  { n: '05', title: 'Vault Loss > Zero', desc: 'Outstanding loan value confirmed' },
  { n: '06', title: 'Pool Coverage Available', desc: 'Reserve balance checked' },
  { n: '07', title: 'NFT Still Live', desc: 'Not previously burned' },
  { n: '08', title: 'Claimant Holds NFT', desc: 'Ownership verified on-chain' },
  { n: '09', title: 'Pool Solvent', desc: 'Rate limit and solvency clear' },
]

const faqItems = [
  { q: 'Does Ward hold any signing keys?', a: 'Never. ward_signed = False is a founding architectural constraint. Ward constructs unsigned transactions. Institutions sign. The chain settles. Ward has no technical capability to move funds.' },
  { q: 'Does Ward use oracles?', a: 'No. All nine validation checks read directly from on-chain ledger state. No external price feeds, no off-chain APIs, no trust dependencies.' },
  { q: 'What happens if Ward\'s API goes down?', a: 'The on-chain validation logic is open-source and can be run locally. The hosted API at api.wardprotocol.org provides convenience "" not dependency. The protocol itself is independent of Ward Labs infrastructure.' },
  { q: 'Which chains does Ward support?', a: 'Ward Protocol is built on XRPL and is chain-agnostic by design. Mainnet at XLS-66 launch. Multi-chain ports (Flare, Solana, Hedera) are in the integration roadmap.' },
  { q: 'How is Ward different from a liquidation bot?', a: 'Liquidation bots are reactive, oracle-dependent, and application-layer. Ward is deterministic, oracle-free, and infrastructure-layer. They solve different problems "" liquidation bots execute after a decision, Ward defines what the decision is.' },
  { q: 'What does Ward-Conformant mean?', a: 'A Ward-Conformant protocol has passed Ward\'s conformance review "" confirming that its vault structure, policy certificates, and settlement flow meet the Ward Protocol specification.' },
]

const statusRows: [string, React.ReactNode][] = [
  ['SDK Version', 'v0.2.5'],
  ['Unit Tests', <span key="tests" style={{ color: 'var(--green)' }}>317 Python · 40 Rust · 45 TypeScript</span>],
  ['Coverage', 'chain_reader 100% · monitor 100% · tx_builder 100% · vault_monitor 99%'],
  ['On-Chain Transactions', '2 confirmed (XRPL Altnet) · F·03""F·05 pending XLS-66 mainnet'],
  ['External Dependencies', '0 "" pure XRPL'],
  ['Ward Holds Keys', 'Never'],
  ['Authoritative State', 'XRPL Ledger'],
  ['Production Code', '2,148 lines'],
  ['XRPLF Standards', 'XLS-66 · XLS-70 · XLS-80 · XLS-20'],
]

const txns = [
  { step: '1 "" Premium Payment',  type: 'Payment',      proves: 'Premium to pool',               hash: 'B756484C...3B8D7E' },
  { step: '2 "" Policy NFT Mint',  type: 'NFTokenMint',  proves: 'Coverage issued (taxon 281)',   hash: '2800219A...E79E2CB' },
  { step: '3 "" Escrow Create',    type: 'EscrowCreate', proves: 'Funds locked PREIMAGE-SHA-256', hash: 'Pending F·05' },
  { step: '4 "" Escrow Finish',    type: 'EscrowFinish', proves: 'Payout released with preimage', hash: 'Pending F·05' },
  { step: '5 "" Policy NFT Burn',  type: 'NFTokenBurn',  proves: 'Replay protection confirmed',  hash: 'Pending F·05' },
]

const S = {
  section: { padding: '92px 0' },
  container: { maxWidth: 1180, margin: '0 auto', padding: '0 36px' },
  containerNarrow: { maxWidth: 780, margin: '0 auto', padding: '0 36px' },
  label: { fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 16, display: 'block' },
  h2: { fontSize: 44, fontWeight: 800, letterSpacing: 0, lineHeight: 1.16, color: 'var(--text-primary)', marginBottom: 20 },
  h2Dark: { fontSize: 44, fontWeight: 800, letterSpacing: 0, lineHeight: 1.16, color: '#162832', marginBottom: 20 },
  body: { fontSize: 18, lineHeight: 1.75, color: 'var(--text-secondary)' },
  bodyDark: { fontSize: 18, lineHeight: 1.75, color: '#4f665f' },
  card: { background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(182,215,206,0.12)', borderRadius: 12, padding: 30, transition: 'border-color 0.2s' },
}

export default function Home() {
  return (
    <>
      {/* â"€â"€ HERO â"€â"€ */}
      <div style={{
        minHeight: 'calc(100vh - 76px)', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(182,215,206,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(212,169,62,0.08) 0%, transparent 50%), #14242b',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(182,215,206,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(212,169,62,0.08) 0%, transparent 50%), linear-gradient(rgba(182,215,206,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(182,215,206,0.035) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 100% 100%, 64px 64px, 64px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ ...S.container, width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(360px,440px)', gap: 56, alignItems: 'center', padding: '96px 36px 78px' }} className="hero-grid">
          {/* Left */}
          <div>
            <span style={{ ...S.label, marginBottom: 24 }}>DETERMINISTIC · ON-CHAIN · ORACLE-FREE</span>
            <h1 className="hero-heading" style={{ fontSize: 56, fontWeight: 850, letterSpacing: 0, lineHeight: 1.12, marginBottom: 24, color: 'var(--text-primary)' }}>
              Deterministic default resolution for{" "}
              <span style={{ background: 'linear-gradient(135deg, #a8c5e8, #e8edf5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                on-chain lending.
              </span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 560 }}>
              When a borrower defaults, Ward Protocol defines exactly what happens.
              Nine on-ledger checks. No oracle. No human judgment. No Ward signature "" ever.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/spec" className="btn-primary">View Specification →</Link>
              <Link href="/demo" className="btn-ghost">Try Demo →</Link>
            </div>
          </div>

          {/* Right "" Status Card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(182,215,206,0.18)', borderRadius: 16, padding: 30, backdropFilter: 'blur(20px)' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(168,197,232,0.08)' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-secondary)', letterSpacing: 0 }}>WARD · v0.2.5 · ALTNET</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--green)', letterSpacing: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                LIVE
              </span>
            </div>

            {/* Invariant */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', letterSpacing: 0, marginBottom: 6 }}>Core Invariant</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: 'var(--gold)', fontWeight: 600 }}>ward_signed = False</div>
            </div>

            {/* Flows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {flows.map(f => (
                <div key={f.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(168,197,232,0.05)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', width: 36 }}>{f.code}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.name}</span>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: f.status === 'LIVE' ? 'var(--green)' : 'var(--gold)', letterSpacing: 0 }}>{f.status}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[{v:'317/317',l:'TESTS'},{v:'FALSE',l:'WARD_SIGNED'},{v:'3',l:'CONFIRMATION WINDOW'}].map(s => (
                <div key={s.l} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{s.v}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', letterSpacing: 0 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* â"€â"€ TICKER â"€â"€ */}
      <div style={{ borderTop: '1px solid rgba(182,215,206,0.12)', borderBottom: '1px solid rgba(182,215,206,0.12)', background: '#edf4f1', padding: '16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 48, padding: '0 32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Active on', 'XRPL Altnet', 'XRPLF Standards #474', 'PyPI · ward-protocol', 'Discord Community', '317 Tests Passing'].map((t, i) => (
            <span key={i} style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: i % 2 === 0 ? '#78908b' : '#284047', letterSpacing: 0, whiteSpace: 'nowrap' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* â"€â"€ PROBLEM â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--steel-2)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={S.label}>THE PROBLEM</span>
          <h2 style={{ fontSize: 46, fontWeight: 850, letterSpacing: 0, lineHeight: 1.16, color: 'var(--text-primary)', marginBottom: 24 }}>
            What happens when the borrower doesn't pay?
          </h2>
          <p style={{ ...S.body, maxWidth: 560, margin: '0 auto 20px' }}>
            Every institution deploying capital into on-chain lending will eventually ask this question.
            Today, there is no standard answer. Every protocol builds their own "" or ignores the risk entirely.
          </p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ice)', fontWeight: 500 }}>Ward Protocol is that missing layer.</p>
        </div>
      </section>

      {/* â"€â"€ HOW IT WORKS â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--steel)' }}>
        <div style={S.container}>
          <div style={{ marginBottom: 56 }}>
            <span style={S.label}>HOW IT WORKS</span>
            <h2 style={S.h2}>Six steps. Fully on-chain.</h2>
            <p style={{ ...S.body, maxWidth: 480 }}>No off-chain oracle. No human judgment. Pure XRPL ledger state at every step.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {steps.map(s => (
              <div key={s.n} style={{ ...S.card, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 8, background: 'rgba(200,169,74,0.12)', border: '1px solid rgba(200,169,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 750, color: 'var(--text-primary)', marginBottom: 12, paddingRight: 44, letterSpacing: 0 }}>{s.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ CORE INVARIANT â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--steel-2)', borderTop: '1px solid rgba(200,169,74,0.15)', borderBottom: '1px solid rgba(200,169,74,0.15)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={S.label}>THE CORE INVARIANT</span>
          <h2 style={{ fontSize: 44, fontWeight: 850, letterSpacing: 0, lineHeight: 1.16, marginBottom: 16, background: 'linear-gradient(135deg, #d4a93e, #f0d080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ward_signed = False "" always
          </h2>
          <p style={{ ...S.body, marginBottom: 36 }}>Ward constructs unsigned transactions. Institutions sign. XRPL settles. Ward is never a counterparty.</p>
          <div style={{ background: '#101d23', border: '1px solid rgba(182,215,206,0.16)', borderRadius: 12, padding: '30px 34px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.4 }} />
            <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', overflowX: 'auto' }}>{`# Ward NEVER does this:
await submit_and_wait(tx, client, ward_wallet)  # Ward has no wallet

# Ward ALWAYS does this:
return UnsignedTransaction(
    tx_dict=tx.to_dict(),
    `}<span style={{ color: 'var(--gold)' }}>ward_signed=False</span>{`
)
# Institution signs and submits with their own wallet`}</pre>
          </div>
          <p style={{ ...S.body, marginTop: 20, fontSize: 14 }}>The gold line holds. This invariant is enforced at the architecture level across every module. No Ward class stores a wallet. No Ward method signs a transaction.</p>
        </div>
      </section>

      {/* â"€â"€ WHY WARD â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--paper)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={{ ...S.label, color: '#c8a94a' }}>WHY WARD</span>
          <h2 style={{ ...S.h2Dark }}>Designed out of the equation.</h2>
          <p style={{ ...S.bodyDark, marginBottom: 24 }}>
            Most infrastructure wants to be in the middle. Ward is built to be invisible. We never hold keys, never co-sign transactions, never act as a counterparty. When a vault defaults, Ward evaluates the conditions and returns an unsigned transaction. The institution signs. The chain settles. Ward was never there.
          </p>
          <div style={{ display: 'inline-block', borderLeft: '3px solid #c8a94a', paddingLeft: 16, textAlign: 'left' }}>
            <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: '#c8a94a', fontWeight: 700 }}>ward_signed = False "" always.</code>
          </div>
        </div>
      </section>

      {/* â"€â"€ NINE ON-LEDGER CHECKS â"€â"€ */}
      <section style={{ ...S.section, background: '#183038', borderTop: '3px solid var(--gold)' }}>
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={S.label}>NINE ON-LEDGER CHECKS</span>
            <h2 style={S.h2}>Every default. The same answer.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="checks-grid">
            {validationSteps.map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(182,215,206,0.14)', borderRadius: 10, padding: 22, transition: 'border-color 0.2s' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--ice)', fontWeight: 700, marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 750, color: 'var(--text-primary)', marginBottom: 7, letterSpacing: 0 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', marginTop: 28 }}>
            All nine must pass. Any failure returns a verifiable rejection reason "" on-chain.
          </p>
        </div>
      </section>

      {/* â"€â"€ CURRENT STATUS â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--steel-2)' }}>
        <div style={S.container}>
          <span style={S.label}>CURRENT STATUS</span>
          <h2 style={{ ...S.h2, marginBottom: 8 }}>Built on XRPL · Mainnet-Ready at XLS-66 Launch</h2>
          <p style={{ ...S.body, marginBottom: 40 }}>All milestones verified on-chain. Transaction hashes available for independent verification.</p>
          <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(182,215,206,0.14)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', background: 'rgba(182,215,206,0.08)', borderBottom: '1px solid rgba(182,215,206,0.12)', padding: '12px 22px' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', letterSpacing: 0 }}>Metric</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', letterSpacing: 0 }}>Value</span>
            </div>
            {statusRows.map(([label, value], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', padding: '14px 22px', borderBottom: i < statusRows.length - 1 ? '1px solid rgba(182,215,206,0.08)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(182,215,206,0.14)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr 1fr', background: 'rgba(182,215,206,0.08)', borderBottom: '1px solid rgba(182,215,206,0.12)', padding: '12px 22px' }}>
              {['STEP','TRANSACTION TYPE','PROVES','HASH'].map(h => (
                <span key={h} style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-tertiary)', letterSpacing: 0 }}>{h}</span>
              ))}
            </div>
            {txns.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.1fr 1fr', padding: '14px 22px', borderBottom: i < txns.length - 1 ? '1px solid rgba(182,215,206,0.08)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t.step}</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{t.type}</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t.proves}</span>
                <span style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', color: t.hash.startsWith('Pending') ? 'var(--gold)' : 'var(--ice)' }}>{t.hash}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ LICENSING â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--paper)' }}>
        <div style={S.container}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ ...S.label, color: '#c8a94a' }}>LICENSING</span>
            <h2 style={S.h2Dark}>One specification. Three tiers.</h2>
            <p style={{ ...S.bodyDark, maxWidth: 520, marginBottom: 24 }}>Ward Protocol is pre-mainnet. All tier pricing is confirmed at XLS-66 mainnet launch. Reach out early to discuss your use case and secure pilot access.</p>
          </div>
          <div style={{ background: '#fff7dc', border: '1px solid #e6c765', borderRadius: 8, padding: '14px 18px', marginBottom: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>â³</span>
            <span style={{ fontSize: 15, color: '#7c6418' }}>Pricing coming soon "" announced at XLS-66 mainnet launch. <a href="mailto:wflores@wardprotocol.org" style={{ color: '#a67c16', fontWeight: 700 }}>Contact us</a> for early institutional access.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
            {[
              { tier: 'DEVELOPER', sub: 'For builders', features: ['Ward Protocol SDK (Python + TypeScript)','Altnet sandbox access','Starter repo + full documentation','XRPLF Discussion #474','Community Discord support'], cta: 'Get Started →', ctaHref: 'https://pypi.org/project/ward-protocol/', featured: false },
              { tier: 'STARTER', sub: 'For teams deploying on-chain', features: ['Ward Protocol SDK access','Python, TypeScript, Java examples','Altnet integration out of the box','XRPLF Discussion #474','Email support'], cta: 'Get in Touch →', ctaHref: 'https://tally.so/r/VLDbBE', featured: false },
              { tier: 'STANDARD', sub: 'For institutional integrations', features: ['Hosted API at api.wardprotocol.org','X-Institution-Key authentication','Onboarding session included','Ward-Conformant certification path','99.9% uptime SLA'], cta: 'Book a Call →', ctaHref: 'https://cal.com/wardprotocol/30min', featured: true },
              { tier: 'ENTERPRISE', sub: 'For regulated institutions', features: ['White-label implementation','Custom SLA and dedicated support','Legal opinion letter support','Direct integration engineering','Priority audit coordination'], cta: 'Book a Call →', ctaHref: 'https://cal.com/wardprotocol/30min', featured: false },
            ].map(p => (
              <div key={p.tier} style={{ background: p.featured ? '#173039' : 'white', border: p.featured ? '2px solid rgba(182,215,206,0.24)' : '1px solid #dce5e1', borderRadius: 12, padding: 26, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', color: p.featured ? 'var(--gold)' : '#94a3b8', marginBottom: 4 }}>{p.tier}</div>
                  <div style={{ fontSize: 14, color: p.featured ? 'var(--text-secondary)' : '#60736d' }}>{p.sub}</div>
                </div>
                <div style={{ height: 1, background: p.featured ? 'rgba(168,197,232,0.1)' : '#f1f5f9', marginBottom: 16 }} />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, marginBottom: 20 }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 14, color: p.featured ? 'var(--text-secondary)' : '#40534e', padding: '6px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: p.featured ? 'var(--green)' : '#94a3b8', marginTop: 1, flexShrink: 0 }}>·</span>{f}
                    </li>
                  ))}
                </ul>
                <a href={p.ctaHref} target={p.ctaHref.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', background: p.featured ? 'var(--text-primary)' : 'transparent', color: p.featured ? 'var(--steel)' : '#162832', border: p.featured ? 'none' : '1px solid #cbd5e1', transition: 'all 0.15s' }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ COMMUNITY SIGNAL â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--steel)' }}>
        <div style={S.container}>
          <div style={{ marginBottom: 48 }}>
            <span style={S.label}>COMMUNITY SIGNAL</span>
            <h2 style={S.h2}>What the ecosystem is saying</h2>
            <p style={{ ...S.body, maxWidth: 480 }}>Unprompted commentary from builders and observers in the XRPL ecosystem.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
            {quotes.map(q => (
              <div key={q.attr} style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: 22, fontStyle: 'italic' }}>&ldquo;{q.text}&rdquo;</p>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{q.attr}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 3 }}>{q.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ FAQ â"€â"€ */}
      <section style={{ ...S.section, background: 'var(--paper)' }}>
        <div style={S.containerNarrow}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ ...S.label, color: '#c8a94a' }}>FAQ</span>
            <h2 style={S.h2Dark}>Common questions.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqItems.map((item, i) => (
              <details key={i} style={{ border: '1px solid #dce5e1', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.72)' }}>
                <summary style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontWeight: 750, fontSize: 16, color: '#162832' }}>
                  {item.q}
                  <span style={{ color: '#c8a94a', fontWeight: 700, fontSize: 20, flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ padding: '0 22px 18px 22px', fontSize: 15, lineHeight: 1.75, color: '#40534e', borderLeft: '3px solid #d4a93e', marginLeft: 22 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* â"€â"€ FINAL CTA â"€â"€ */}
      <section style={{ ...S.section, background: '#1d3035', borderTop: '1px solid rgba(182,215,206,0.12)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <h2 style={{ ...S.h2, marginBottom: 16 }}>Ready to add default protection to your vault?</h2>
          <p style={{ ...S.body, marginBottom: 36 }}>Ward Protocol is free to implement. The specification is open. The rails are yours.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/spec" className="btn-primary">View Specification →</Link>
            <a href="mailto:wflores@wardprotocol.org" className="btn-ghost">Contact Us</a>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; padding: 72px 24px 60px !important; gap: 36px !important; }
          .hero-grid > div { min-width: 0 !important; }
          .hero-heading { font-size: 36px !important; line-height: 1.16 !important; }
          .checks-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .hero-heading { font-size: 31px !important; }
        }
      `}</style>
    </>
  )
}
