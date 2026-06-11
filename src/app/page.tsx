import Link from 'next/link';

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
  { num: '634', label: 'passing tests' },
  { num: '92%', label: 'critical path coverage' },
  { num: '8', label: 'chain adapters' },
  { num: '32', label: 'formal invariants' },
  { num: 'v0.2.6', label: 'PyPI + npm' },
];

const API_STATS: { label: string; value: string; color: string }[] = [
  { label: 'Endpoint', value: 'api.wardprotocol.org', color: '#1d4ed8' },
  { label: 'Version', value: 'v0.2.6', color: '#0f2439' },
  { label: 'Tests passing', value: '634 / 634', color: '#15803d' },
  { label: 'Coverage', value: '92%', color: '#15803d' },
  { label: 'Last validation', value: 'checks_passed: 1', color: '#15803d' },
];

export default function Home() {
  return (
    <main style={{ background: '#ffffff' }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="site-container">
          <div className="grid items-stretch lg:grid-cols-2" style={{ minHeight: 640 }}>
            {/* Left column */}
            <div className="flex flex-col justify-center py-20" style={{ paddingRight: 60 }}>
              {/* Eyebrow */}
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#a7c5e5',
                  marginBottom: 20,
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                Institutional tokenized credit · conformance standard
              </p>

              {/* H1 */}
              <h1
                style={{
                  fontSize: 'clamp(48px, 5.5vw, 64px)',
                  fontWeight: 700,
                  lineHeight: 1.0,
                  letterSpacing: '-0.025em',
                  color: '#0f2439',
                }}
              >
                <span style={{ display: 'block' }}>
                  Default<span style={{ color: '#b8973a' }}>.</span>
                </span>
                <span style={{ display: 'block' }}>
                  Resolved<span style={{ color: '#b8973a' }}>.</span>
                </span>
                <span style={{ display: 'block' }}>
                  On-chain<span style={{ color: '#b8973a' }}>.</span>
                </span>
              </h1>

              {/* Gold rule */}
              <div style={{ width: 56, height: 3, background: '#b8973a', borderRadius: 2, margin: '20px 0 24px' }} />

              {/* Subtitle */}
              <p style={{ fontSize: 17, color: '#5a7a99', lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>
                Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults,
                preserve the signer boundary, and export reviewable conformance receipts.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href={PILOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:bg-[#0d1f32]"
                  style={{
                    background: '#0f2439',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    padding: '13px 28px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Discuss a pilot
                </a>
                <Link
                  href="/spec"
                  className="transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{
                    background: 'transparent',
                    color: '#0f2439',
                    fontSize: 15,
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: '1.5px solid #c8d9eb',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  View the protocol →
                </Link>
              </div>

              {/* Version badge */}
              <div
                style={{
                  marginTop: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F9FAFC',
                  border: '1px solid #E4E9F2',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 12,
                  color: '#6b8ba4',
                  width: 'fit-content',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#16a34a',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                v0.2.6 · 8 chains · 634 tests · ward_signed = False
              </div>
            </div>

            {/* Right column — full-bleed visual panel */}
            <div
              className="relative hidden overflow-hidden lg:block"
              style={{ borderRadius: '24px 0 0 0', minHeight: 520, marginRight: '-3rem' }}
            >
              {/* Background gradient */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #e8eef5 0%, #dce8f5 40%, #c8d9eb 100%)',
                }}
              />

              {/* Decorative shape 1 — large circle top-right */}
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  right: -80,
                  width: 420,
                  height: 420,
                  borderRadius: '50%',
                  background: 'rgba(167,197,229,0.25)',
                }}
              />

              {/* Decorative shape 2 — smaller circle bottom-left */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -40,
                  left: -40,
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'rgba(15,36,57,0.06)',
                }}
              />

              {/* Floating data card */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -56%)',
                  width: 300,
                  background: 'rgba(255,255,255,0.88)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    borderBottom: '1px solid #E4E9F2',
                    marginBottom: 16,
                    paddingBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#a7c5e5',
                    }}
                  >
                    Live API Status
                  </span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#15803d',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    XRPL Altnet
                  </span>
                </div>

                {/* Stat rows */}
                {API_STATS.map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #F9FAFC',
                      padding: '6px 0',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#8a9bb0' }}>{label}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Invariant banner — pinned to bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 32,
                  left: 24,
                  right: 24,
                  background: 'rgba(255,255,255,0.9)',
                  borderLeft: '3px solid #b8973a',
                  borderRadius: '0 8px 8px 0',
                  padding: '10px 14px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#b8973a',
                  }}
                >
                  Core Invariant
                </p>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f2439',
                    marginTop: 4,
                  }}
                >
                  ward_signed = False — always.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
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
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#0f2439',
                    lineHeight: 1,
                  }}
                >
                  {num}
                </p>
                <p style={{ fontSize: 12, color: '#8a9bb0', marginTop: 5 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The standard */}
      <section className="site-section">
        <div className="site-container py-24">
          <div className="max-w-xl">
            <p className="site-label">The standard</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Tokenized credit needs a default process that holds up under scrutiny.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-xl border bg-white p-5"
                style={{ borderColor: '#E4E9F2', boxShadow: '0 1px 3px rgba(15,36,57,0.06)' }}
              >
                <div className="mb-5 h-[3px] w-7 rounded-sm bg-[#b8973a]" />
                <h3 className="text-[18px] font-semibold leading-snug text-[#0f2439]">{pillar.title}</h3>
                <p className="mt-4 text-[15px] leading-[1.75] text-[#5a7a99]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Core invariant card */}
      <section className="site-section">
        <div className="site-container py-24">
          <div
            className="rounded-xl border bg-white p-8 md:p-10"
            style={{ borderColor: '#E4E9F2', borderLeft: '3px solid #b8973a', boxShadow: '0 1px 3px rgba(15,36,57,0.06)' }}
          >
            <div className="max-w-2xl">
              <p
                className="font-mono font-bold uppercase"
                style={{ fontSize: 11, letterSpacing: '0.12em', color: '#b8973a' }}
              >
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
        </div>
      </section>

      {/* CTA */}
      <section className="site-section">
        <div className="site-container py-24">
          <div
            className="rounded-xl border bg-white p-8 md:p-12"
            style={{ borderColor: '#E4E9F2', boxShadow: '0 1px 3px rgba(15,36,57,0.06)' }}
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
                <Link
                  href="/demo"
                  className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  Enter the Demo
                </Link>
                <a
                  href={PILOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Discuss a Pilot
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
