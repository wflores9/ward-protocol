import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build on Ward Protocol',
  description: 'Everything you need to integrate Ward Protocol — Python SDK, TypeScript SDK, live API, and enterprise licensing.',
}

const S = {
  section: { padding: '80px 0' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 32px' },
  containerNarrow: { maxWidth: 720, margin: '0 auto', padding: '0 32px' },
  label: { fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 16, display: 'block' },
  h2: { fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 12, padding: 28 },
}

export default function BuildPage() {
  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--steel-2)', borderBottom: '1px solid rgba(168,197,232,0.08)', padding: '72px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span style={S.label}>WARD PROTOCOL — BUILD</span>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--text-primary)', marginBottom: 20 }}>
            Everything you need<br />to integrate Ward.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            From PyPI package to production API. Free to start. Ward-Conformant certification available.
          </p>
        </div>
      </div>

      {/* GET STARTED */}
      <section style={{ ...S.section, background: 'var(--steel)' }}>
        <div style={S.container}>
          <span style={S.label}>GET STARTED — FREE</span>
          <h2 style={S.h2}>Install in 30 seconds.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16, marginTop: 32 }}>

            {/* Python */}
            <div style={S.card}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 12 }}>PYTHON SDK</div>
              <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.1)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} />
                <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--ice)' }}>pip install ward-protocol==0.2.6</code>
              </div>
              <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, overflowX: 'auto' }}>{`from ward import WardClient, ClaimValidator

client = WardClient(
  url="https://s.altnet.rippletest.net:51234/"
)

# Ward builds unsigned tx — institution signs
result = await client.purchase_coverage(
  institution_address=institution_addr,
  vault_address=vault_addr,
  coverage_drops=500_000_000,
  period_days=30,
  pool_address=pool_addr,
)
# ward_signed = False — always.`}</pre>
              </div>
              <a href="https://pypi.org/project/ward-protocol/" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: 'block', textAlign: 'center', fontSize: 14 }}>
                View on PyPI →
              </a>
            </div>

            {/* TypeScript */}
            <div style={S.card}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 12 }}>TYPESCRIPT SDK</div>
              <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.1)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} />
                <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--ice)' }}>npm install ward-protocol</code>
              </div>
              <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, overflowX: 'auto' }}>{`import { WardClient } from 'ward-protocol'

const client = new WardClient({
  api_url: 'https://api.wardprotocol.org',
  institution_key: 'ward_T_...'
})

const result = await client.validateClaim(
  claimantAddress,
  nftTokenId,
  defaultedVault,
  loanId,
  poolAddress,
)
// result.approved — true / false`}</pre>
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                TypeScript SDK — v0.2.6
              </p>
            </div>

            {/* API */}
            <div style={S.card}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 12 }}>LIVE API</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Base URL</div>
                <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 6, padding: '10px 14px' }}>
                  <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--ice)' }}>https://api.wardprotocol.org</code>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Authentication</div>
                <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 6, padding: '10px 14px' }}>
                  <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--text-secondary)' }}>X-Institution-Key: ward_T_...</code>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Generate API Key</div>
                <div style={{ background: '#060d1a', border: '1px solid rgba(168,197,232,0.08)', borderRadius: 6, padding: '10px 14px' }}>
                  <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: 'var(--green)' }}>POST /keys/generate</code>
                </div>
              </div>
              <a href="https://api.wardprotocol.org/health" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: 'block', textAlign: 'center', fontSize: 14 }}>
                Check API Health →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Go Live */}
      <section style={{ ...S.section, background: 'var(--steel-2)' }}>
        <div style={S.container}>
          <span style={S.label}>GO LIVE — INSTITUTIONAL</span>
          <h2 style={S.h2}>From Altnet to mainnet.</h2>
          <p style={{ ...S.body, maxWidth: 520, marginBottom: 40 }}>Ward is pre-mainnet. All paths below lead to mainnet readiness at XLS-66 launch.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
            {[
              { label: 'Ward-Conformant Review', desc: 'Get your vault architecture reviewed against the Ward spec. Certification signals institutional-grade default resolution to your depositors.', cta: 'Start Review →', href: '/demo' },
              { label: 'Starter Integration', desc: 'SDK integration for teams building on XRPL. Includes Altnet setup, policy NFT minting, and claim validation walkthrough.', cta: 'Get in Touch →', href: 'https://tally.so/r/VLDbBE' },
              { label: 'Enterprise Deployment', desc: 'Custom SLA, dedicated onboarding, legal opinion letter support, and direct integration engineering for regulated institutions.', cta: 'Book a Call →', href: 'https://cal.com/wardprotocol/30min' },
            ].map(item => (
              <div key={item.label} style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>{item.label}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', flex: 1, marginBottom: 20 }}>{item.desc}</p>
                <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="btn-ghost" style={{ display: 'block', textAlign: 'center', fontSize: 14 }}>
                  {item.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* XRPLF Discussion */}
      <section style={{ ...S.section, background: 'var(--steel)', borderTop: '1px solid rgba(168,197,232,0.08)' }}>
        <div style={{ ...S.containerNarrow, textAlign: 'center' }}>
          <span style={S.label}>XRPLF DISCUSSION #474</span>
          <h2 style={S.h2}>Follow the standard as it evolves.</h2>
          <p style={{ ...S.body, marginBottom: 32 }}>Ward Protocol is an active discussion in the XRPL Foundation Standards repository. Join the conversation, challenge the spec, and shape the default resolution standard.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://github.com/XRPLF/XRPL-Standards/discussions/474" target="_blank" rel="noopener noreferrer" className="btn-primary">View Discussion #474 →</a>
            <Link href="/spec" className="btn-ghost">Read the Spec</Link>
          </div>
        </div>
      </section>
    </>
  )
}
