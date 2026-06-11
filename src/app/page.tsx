import Link from 'next/link';
import FadeUp from '@/components/FadeUp';
import AnimatedCounter from '@/components/AnimatedCounter';
import ValidationViz from '@/components/ValidationViz';
import { PILOT_URL } from '@/lib/navigation';

const pillars = [
  {
    title: 'Deterministic evidence model',
    body: 'Ward re-reads authoritative ledger state and applies the same resolution logic every time. Inspectable and repeatable under institutional review.',
  },
  {
    title: 'Signer boundary preserved',
    body: 'Ward validates and returns unsigned settlement instructions. Institutions sign. The chain settles. Ward never holds keys and never becomes a signatory.',
  },
  {
    title: 'Designed for scrutiny',
    body: 'Evidence gates, control boundaries, and on-ledger checks are packaged so engineering, risk, and compliance teams can review the same record.',
  },
];

const PROOF_STATS = [
  { num: '537', label: 'passing tests' },
  { num: '92%', label: 'critical path coverage' },
  { num: '8',   label: 'chain adapters' },
  { num: '32',  label: 'formal invariants' },
  { num: 'v0.2.6', label: 'PyPI + npm' },
];

const API_STATS: { label: string; value: string; color: string }[] = [
  { label: 'Endpoint', value: 'api.wardprotocol.org', color: '#1d4ed8' },
  { label: 'Version',  value: 'v0.2.6',      color: '#0f2439' },
  { label: 'Tests',    value: '537 / 537',   color: '#15803d' },
  { label: 'Coverage', value: '92%',         color: '#15803d' },
  { label: 'Checks',   value: 'passed: 1',   color: '#15803d' },
];

export default function Home() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="mesh-bg relative overflow-hidden">
        <div className="mesh-bg-inner absolute inset-0 pointer-events-none" />
        {/* Subtle grid overlay */}
        <div className="grid-overlay absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }} />

        <div className="site-container relative z-10">
          <div className="grid items-stretch lg:grid-cols-2" style={{ minHeight: 660 }}>

            {/* Left column */}
            <div className="flex flex-col justify-center py-24" style={{ paddingRight: 60 }}>
              <FadeUp delay={0}>
                <p style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#a7c5e5',
                  marginBottom: 20, fontFamily: 'DM Mono, monospace',
                }}>
                  Institutional tokenized credit · conformance standard
                </p>
              </FadeUp>

              <FadeUp delay={60}>
                <h1 style={{
                  fontSize: 'clamp(48px, 5.5vw, 64px)', fontWeight: 700,
                  lineHeight: 1.0, letterSpacing: '-0.025em', color: '#0f2439',
                }}>
                  <span style={{ display: 'block' }}>Default<span style={{ color: '#b8973a' }}>.</span></span>
                  <span style={{ display: 'block' }}>Resolved<span style={{ color: '#b8973a' }}>.</span></span>
                  <span style={{ display: 'block' }}>On-chain<span style={{ color: '#b8973a' }}>.</span></span>
                </h1>
              </FadeUp>

              <FadeUp delay={120}>
                <div style={{ width: 56, height: 3, background: '#b8973a', borderRadius: 2, margin: '20px 0 24px' }} />
                <p style={{ fontSize: 17, color: '#5a7a99', lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>
                  Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults,
                  preserve the signer boundary, and export reviewable conformance receipts.
                </p>
              </FadeUp>

              <FadeUp delay={180}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a
                    href={PILOT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Discuss a pilot
                  </a>
                  <Link href="/spec" className="btn-ghost">
                    View the protocol →
                  </Link>
                </div>

                {/* Version badge */}
                <div style={{
                  marginTop: 24,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(249,250,252,0.85)',
                  border: '1px solid rgba(228,233,242,0.9)',
                  borderRadius: 6, padding: '6px 12px',
                  fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#6b8ba4',
                  width: 'fit-content',
                  backdropFilter: 'blur(8px)',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#16a34a', display: 'inline-block', flexShrink: 0,
                  }} />
                  v0.2.6 · 8 chains · 537 tests · ward_signed = False
                </div>
              </FadeUp>
            </div>

            {/* Right column — validation viz */}
            <div
              className="relative hidden overflow-hidden lg:flex items-center justify-center"
              style={{ borderRadius: '24px 0 0 0', minHeight: 520, marginRight: '-3rem' }}
            >
              {/* Gradient background */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #eef3f9 0%, #e2edf7 40%, #d6e6f4 100%)',
              }} />
              {/* Animated orbs */}
              <div className="animate-mesh-1 absolute" style={{
                top: -60, right: -80, width: 380, height: 380, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,197,229,0.3) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }} />
              <div className="animate-mesh-2 absolute" style={{
                bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(184,151,58,0.12) 0%, transparent 70%)',
                filter: 'blur(32px)',
              }} />

              {/* Glass card wrapping the viz */}
              <div
                className="card-glass relative z-10 flex flex-col items-center"
                style={{ padding: '28px 24px', width: 340, borderRadius: 20 }}
              >
                <p style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a7c5e5',
                  marginBottom: 4,
                }}>
                  9 On-Ledger Validation Checks
                </p>
                <p style={{ fontSize: 11, color: '#8a9bb0', marginBottom: 16, textAlign: 'center' }}>
                  Each check reads live ledger state — no oracle
                </p>
                <ValidationViz />
              </div>

              {/* Invariant banner pinned to bottom */}
              <div style={{
                position: 'absolute', bottom: 28, left: 20, right: 20,
                background: 'rgba(255,255,255,0.9)',
                borderLeft: '3px solid #b8973a',
                borderRadius: '0 8px 8px 0',
                padding: '10px 14px',
                backdropFilter: 'blur(8px)',
              }}>
                <p style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b8973a',
                }}>Core Invariant</p>
                <p style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 13,
                  fontWeight: 700, color: '#0f2439', marginTop: 4,
                }}>
                  ward_signed = False — always.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF STRIP (animated counters) ── */}
      <div style={{ background: '#ffffff', borderTop: '1px solid #E4E9F2', borderBottom: '1px solid #E4E9F2' }}>
        <div className="site-container">
          <div className="grid grid-cols-2 md:grid-cols-5">
            {PROOF_STATS.map(({ num, label }, i) => (
              <div
                key={label}
                style={{
                  padding: '28px 20px',
                  borderRight: i < 4 ? '1px solid #F0F4F8' : undefined,
                  textAlign: 'center',
                }}
              >
                <p style={{
                  fontFamily: 'DM Mono, monospace', lineHeight: 1,
                }}>
                  <AnimatedCounter
                    value={num}
                    className="text-[32px] font-bold text-[#0f2439]"
                  />
                </p>
                <p style={{ fontSize: 12, color: '#8a9bb0', marginTop: 5 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── THE STANDARD ── */}
      <section className="mesh-bg site-section">
        <div className="mesh-bg-inner absolute inset-0 pointer-events-none" />
        <div className="site-container py-24 relative z-10">
          <FadeUp>
            <div className="max-w-xl">
              <p className="site-label">The standard</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Tokenized credit needs a default process that holds up under scrutiny.
              </h2>
            </div>
          </FadeUp>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar, i) => (
              <FadeUp key={pillar.title} delay={i * 70}>
                <article className="card-glass rounded-xl p-6 h-full">
                  <div className="mb-5 h-[3px] w-7 rounded-sm bg-[#b8973a]" />
                  <h3 className="text-[18px] font-semibold leading-snug text-[#0f2439]">{pillar.title}</h3>
                  <p className="mt-4 text-[15px] leading-[1.75] text-[#5a7a99]">{pillar.body}</p>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE INVARIANT ── */}
      <section className="site-section" style={{ background: '#ffffff' }}>
        <div className="site-container py-24">
          <FadeUp>
            <div
              className="rounded-xl p-8 md:p-10"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #E4E9F2',
                borderLeft: '3px solid #b8973a',
                boxShadow: '0 4px 24px rgba(15,36,57,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="max-w-2xl">
                <p className="font-mono font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#b8973a' }}>
                  Core invariant
                </p>
                <h2 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                  ward_signed = False — always.
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                  Ward prepares deterministic validation and unsigned settlement instructions. Institutions sign. The chain
                  settles. Ward is never a counterparty, never a custodian, and never a signatory.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mesh-bg site-section">
        <div className="mesh-bg-inner absolute inset-0 pointer-events-none" />
        <div className="site-container py-24 relative z-10">
          <FadeUp>
            <div
              className="rounded-xl p-8 md:p-12"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(228,233,242,0.9)',
                boxShadow: '0 4px 32px rgba(15,36,57,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="max-w-2xl">
                <p className="site-label">Pilots open now</p>
                <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                  Ward Protocol is pre-mainnet. Pilots open now.
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                  Run the conformance demo, inspect the evidence surface, and book a pilot call when you are ready.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/demo" className="btn-primary">Enter the Demo</Link>
                  <a
                    href={PILOT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Discuss a Pilot
                  </a>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
