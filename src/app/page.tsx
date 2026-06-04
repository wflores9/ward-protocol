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
  { q: 'What happens if Ward\'s API goes down?', a: 'The on-chain validation logic is open-source and can be run locally. The hosted API at api.wardprotocol.org provides convenience — not dependency. The protocol itself is independent of Ward Labs infrastructure.' },
  { q: 'Which chains does Ward support?', a: 'Ward Protocol is built on XRPL and is chain-agnostic by design. Mainnet at XLS-66 launch. Multi-chain ports (Flare, Solana, Hedera) are in the integration roadmap.' },
  { q: 'How is Ward different from a liquidation bot?', a: 'Liquidation bots are reactive, oracle-dependent, and application-layer. Ward is deterministic, oracle-free, and infrastructure-layer. They solve different problems — liquidation bots execute after a decision, Ward defines what the decision is.' },
  { q: 'What does Ward-Conformant mean?', a: 'A Ward-Conformant protocol has passed Ward\'s conformance review — confirming that its vault structure, policy certificates, and settlement flow meet the Ward Protocol specification.' },
]

const statusRows: [string, React.ReactNode][] = [
  ['SDK Version', 'v0.2.5'],
  ['Unit Tests', <span key="tests" style={{ color: 'var(--green)' }}>317 Python · 40 Rust · 45 TypeScript</span>],
  ['Coverage', 'chain_reader 100% · monitor 100% · tx_builder 100% · vault_monitor 99%'],
  ['On-Chain Transactions', '2 confirmed (XRPL Altnet) · F·03–F·05 pending XLS-66 mainnet'],
  ['External Dependencies', '0 — pure XRPL'],
  ['Ward Holds Keys', 'Never'],
  ['Authoritative State', 'XRPL Ledger'],
  ['Production Code', '2,148 lines'],
  ['XRPLF Standards', 'XLS-66 · XLS-70 · XLS-80 · XLS-20'],
]

const txns = [
  { step: '1 — Premium Payment',  type: 'Payment',      proves: 'Premium to pool',               hash: 'B756484C...3B8D7E' },
  { step: '2 — Policy NFT Mint',  type: 'NFTokenMint',  proves: 'Coverage issued (taxon 281)',   hash: '2800219A...E79E2CB' },
  { step: '3 — Escrow Create',    type: 'EscrowCreate', proves: 'Funds locked PREIMAGE-SHA-256', hash: 'Pending F·05' },
  { step: '4 — Escrow Finish',    type: 'EscrowFinish', proves: 'Payout released with preimage', hash: 'Pending F·05' },
  { step: '5 — Policy NFT Burn',  type: 'NFTokenBurn',  proves: 'Replay protection confirmed',  hash: 'Pending F·05' },
]

const S = {
  section: { padding: '96px 0' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 32px' },
  containerNarrow: { maxWidth: 720, margin: '0 auto', padding: '0 32px' },
  label: { fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 16, display: 'block' },
  h2: { fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 20 },
  h2Dark: { fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--steel)', marginBottom: 20 },
  body: { fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)' },
  bodyDark: { fontSize: 17, lineHeight: 1.7, color: '#4a5568' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 12, padding: 28, transition: 'border-color 0.2s' },
}

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(168,197,232,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(200,169,74,0.05) 0%, transparent 50%), #080f1e',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(168,197,232,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(200,169,74,0.05) 0%, transparent 50%), linear-gradient(rgba(168,197,232,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(168,197,232,0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 100% 100%, 64px 64px, 64px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ ...S.container, width: '100%', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'center', padding: '80px 32px' }} className="hero-grid">
          {/* Left */}
          <div>
            <span style={{ ...S.label, marginBottom: 24 }}>DETERMINISTIC · ON-CHAIN · ORACLE-FREE</span>
            <h1 style={{ fontSize: 'clamp(40px,5.5vw,72px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 24, color: 'var(--text-primary)' }}>
              Deterministic default<br />resolution for{" "}
              <span style={{ background: 'linear-gradient(135deg, #a8c5e8, #e8edf5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                on-chain lending.
              </span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 520 }}>
              When a borrower defaults, Ward Protocol defines exactly what happens.
              Nine on-ledger checks. No oracle. No human judgment. No Ward signature — ever.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/spec" className="btn-primary">View Specification →</Link>
              <Link href="/demo" className="btn-ghost">Try Demo →</Link>
            </div>
          </div>

          {/* Right — Status Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,197,232,0.12)', borderRadius: 16, padding: 28, backdropFilter: 'blur(20px)' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(168,197,232,0.08)' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>WARD · v0.2.5 · ALTNET</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--green)', letterSpacing: '0.08em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                LIVE
              </span>
            </div>

            {/* Invariant */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 6 }}>CORE INVARIANT</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--gold)', fontWeight: 500 }}>ward_signed = False</div>
            </div>

            {/* Flows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {flows.map(f => (
                <div key={f.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(168,197,232,0.05)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-tertiary)', width: 32 }}>{f.code}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.name}</span>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: f.status === 'LIVE' ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.05em' }}>{f.status}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[{v:'317/317',l:'TESTS'},{v:'FALSE',l:'WARD_SIGNED'},{v:'3',l:'CONFIRMATION WINDOW'}].map(s => (
                <div key={s.l} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{s.v}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div style={{ borderTop: '1px solid rgba(168,197,232,0.08)', borderBottom: '1px solid rgba(168,197,232,0.08)', background: 'rgba(255,255,255,0.02)', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 48, padding: '0 32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Active on', 'XRPL Altnet', 'XRPLF Standards #474', 'PyPI · ward-protocol', 'Discord Community', '317 Tests Passing'].map((t, i) => (
            <span key={i} style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: i % 2 === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section style={{ ...S.section, background: 'var(--steel-2)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={S.label}>THE PROBLEM</span>
          <h2 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--text-primary)', marginBottom: 24 }}>
            What happens when the<br />borrower doesn't pay?
          </h2>
          <p style={{ ...S.body, maxWidth: 560, margin: '0 auto 20px' }}>
            Every institution deploying capital into on-chain lending will eventually ask this question.
            Today, there is no standard answer. Every protocol builds their own — or ignores the risk entirely.
          </p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: 'var(--ice)', fontWeight: 500 }}>Ward Protocol is that missing layer.</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
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
                <div style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 8, background: 'rgba(200,169,74,0.12)', border: '1px solid rgba(200,169,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{s.n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, paddingRight: 40, letterSpacing: '-0.02em' }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE INVARIANT ── */}
      <section style={{ ...S.section, background: 'var(--steel-2)', borderTop: '1px solid rgba(200,169,74,0.15)', borderBottom: '1px solid rgba(200,169,74,0.15)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={S.label}>THE CORE INVARIANT</span>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16, background: 'linear-gradient(135deg, #c8a94a, #f0d080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ward_signed = False — always
          </h2>
          <p style={{ ...S.body, marginBottom: 36 }}>Ward constructs unsigned transactions. Institutions sign. XRPL settles. Ward is never a counterparty.</p>
          <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.12)', borderRadius: 12, padding: '28px 32px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.4 }} />
            <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', overflowX: 'auto' }}>{`# Ward NEVER does this:
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

      {/* ── WHY WARD ── */}
      <section style={{ ...S.section, background: '#f8fafc' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={{ ...S.label, color: '#c8a94a' }}>WHY WARD</span>
          <h2 style={{ ...S.h2Dark }}>Designed out of the equation.</h2>
          <p style={{ ...S.bodyDark, marginBottom: 24 }}>
            Most infrastructure wants to be in the middle. Ward is built to be invisible. We never hold keys, never co-sign transactions, never act as a counterparty. When a vault defaults, Ward evaluates the conditions and returns an unsigned transaction. The institution signs. The chain settles. Ward was never there.
          </p>
          <div style={{ display: 'inline-block', borderLeft: '3px solid #c8a94a', paddingLeft: 16, textAlign: 'left' }}>
            <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, color: '#c8a94a', fontWeight: 700 }}>ward_signed = False — always.</code>
          </div>
        </div>
      </section>

      {/* ── NINE ON-LEDGER CHECKS ── */}
      <section style={{ ...S.section, background: 'var(--steel)', borderTop: '3px solid var(--gold)' }}>
        <div style={S.container}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={S.label}>NINE ON-LEDGER CHECKS</span>
            <h2 style={S.h2}>Every default. The same answer.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="checks-grid">
            {validationSteps.map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 10, padding: 20, transition: 'border-color 0.2s' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--ice)', fontWeight: 700, marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 28 }}>
            All nine must pass. Any failure returns a verifiable rejection reason — on-chain.
          </p>
        </div>
      </section>

      {/* ── CURRENT STATUS ── */}
      <section style={{ ...S.section, background: 'var(--steel-2)' }}>
        <div style={S.container}>
          <span style={S.label}>CURRENT STATUS</span>
          <h2 style={{ ...S.h2, marginBottom: 8 }}>Built on XRPL · Mainnet-Ready at XLS-66 Launch</h2>
          <p style={{ ...S.body, marginBottom: 40 }}>All milestones verified on-chain. Transaction hashes available for independent verification.</p>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,197,232,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: 'rgba(168,197,232,0.05)', borderBottom: '1px solid rgba(168,197,232,0.08)', padding: '10px 20px' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>METRIC</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>VALUE</span>
            </div>
            {statusRows.map(([label, value], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', padding: '12px 20px', borderBottom: i < statusRows.length - 1 ? '1px solid rgba(168,197,232,0.06)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,197,232,0.1)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: 'rgba(168,197,232,0.05)', borderBottom: '1px solid rgba(168,197,232,0.08)', padding: '10px 20px' }}>
              {['STEP','TRANSACTION TYPE','PROVES','HASH'].map(h => (
                <span key={h} style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{h}</span>
              ))}
            </div>
            {txns.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: i < txns.length - 1 ? '1px solid rgba(168,197,232,0.06)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.step}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{t.type}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.proves}</span>
                <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: t.hash.startsWith('Pending') ? 'var(--gold)' : 'var(--ice)' }}>{t.hash}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LICENSING ── */}
      <section style={{ ...S.section, background: '#f8fafc' }}>
        <div style={S.container}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ ...S.label, color: '#c8a94a' }}>LICENSING</span>
            <h2 style={S.h2Dark}>One specification. Three tiers.</h2>
            <p style={{ ...S.bodyDark, maxWidth: 520, marginBottom: 24 }}>Ward Protocol is pre-mainnet. All tier pricing is confirmed at XLS-66 mainnet launch. Reach out early to discuss your use case and secure pilot access.</p>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #f0d080', borderRadius: 8, padding: '12px 16px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⏳</span>
            <span style={{ fontSize: 14, color: '#8B6914' }}>Pricing coming soon — announced at XLS-66 mainnet launch. <a href="mailto:wflores@wardprotocol.org" style={{ color: '#c8a94a', fontWeight: 700 }}>Contact us</a> for early institutional access.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
            {[
              { tier: 'DEVELOPER', sub: 'For builders', features: ['Ward Protocol SDK (Python + TypeScript)','Altnet sandbox access','Starter repo + full documentation','XRPLF Discussion #474','Community Discord support'], cta: 'Get Started →', ctaHref: 'https://pypi.org/project/ward-protocol/', featured: false },
              { tier: 'STARTER', sub: 'For teams deploying on-chain', features: ['Ward Protocol SDK access','Python, TypeScript, Java examples','Altnet integration out of the box','XRPLF Discussion #474','Email support'], cta: 'Get in Touch →', ctaHref: 'https://tally.so/r/VLDbBE', featured: false },
              { tier: 'STANDARD', sub: 'For institutional integrations', features: ['Hosted API at api.wardprotocol.org','X-Institution-Key authentication','Onboarding session included','Ward-Conformant certification path','99.9% uptime SLA'], cta: 'Book a Call →', ctaHref: 'https://cal.com/wardprotocol/30min', featured: true },
              { tier: 'ENTERPRISE', sub: 'For regulated institutions', features: ['White-label implementation','Custom SLA and dedicated support','Legal opinion letter support','Direct integration engineering','Priority audit coordination'], cta: 'Book a Call →', ctaHref: 'https://cal.com/wardprotocol/30min', featured: false },
            ].map(p => (
              <div key={p.tier} style={{ background: p.featured ? 'var(--steel)' : 'white', border: p.featured ? '2px solid rgba(168,197,232,0.2)' : '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: p.featured ? 'var(--gold)' : '#94a3b8', marginBottom: 4 }}>{p.tier}</div>
                  <div style={{ fontSize: 13, color: p.featured ? 'var(--text-secondary)' : '#64748b' }}>{p.sub}</div>
                </div>
                <div style={{ height: 1, background: p.featured ? 'rgba(168,197,232,0.1)' : '#f1f5f9', marginBottom: 16 }} />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, marginBottom: 20 }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: p.featured ? 'var(--text-secondary)' : '#475569', padding: '5px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: p.featured ? 'var(--green)' : '#94a3b8', marginTop: 1, flexShrink: 0 }}>·</span>{f}
                    </li>
                  ))}
                </ul>
                <a href={p.ctaHref} target={p.ctaHref.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', padding: '11px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', background: p.featured ? 'var(--text-primary)' : 'transparent', color: p.featured ? 'var(--steel)' : '#0d1f35', border: p.featured ? 'none' : '1px solid #cbd5e1', transition: 'all 0.15s' }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY SIGNAL ── */}
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
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{q.text}&rdquo;</p>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{q.attr}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{q.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...S.section, background: '#f8fafc' }}>
        <div style={S.containerNarrow}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ ...S.label, color: '#c8a94a' }}>FAQ</span>
            <h2 style={S.h2Dark}>Common questions.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqItems.map((item, i) => (
              <details key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <summary style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none', fontWeight: 700, fontSize: 15, color: '#0d1f35' }}>
                  {item.q}
                  <span style={{ color: '#c8a94a', fontWeight: 700, fontSize: 20, flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ padding: '0 20px 16px 20px', fontSize: 14, lineHeight: 1.7, color: '#475569', borderLeft: '3px solid #c8a94a', marginLeft: 20 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ ...S.section, background: 'var(--steel-2)', borderTop: '1px solid rgba(168,197,232,0.08)' }}>
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
          .hero-grid { grid-template-columns: 1fr !important; }
          .checks-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
