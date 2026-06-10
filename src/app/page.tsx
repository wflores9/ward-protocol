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
  { num: '537', suffix: '', label: 'passing tests' },
  { num: '92', suffix: '%', label: 'critical path coverage' },
  { num: '8', suffix: '', label: 'chain adapters' },
  { num: '32', suffix: '', label: 'formal invariants' },
  { num: 'v0.2.6', suffix: '', label: 'PyPI + npm' },
];

const API_STATS: { label: string; value: string; color: string }[] = [
  { label: 'Endpoint', value: 'api.wardprotocol.org', color: '#1d4ed8' },
  { label: 'Version', value: 'v0.2.6', color: '#0f2439' },
  { label: 'Tests passing', value: '537 / 537', color: '#15803d' },
  { label: 'Coverage', value: '92%', color: '#15803d' },
  { label: 'Chains', value: '8 adapters', color: '#0f2439' },
  { label: 'Last validation', value: 'checks_passed: 1', color: '#15803d' },
];

export default function Home() {
  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left column */}
            <div>
              <p className="site-label">Institutional tokenized credit · conformance standard</p>
              <h1 className="mt-7 text-[40px] font-semibold leading-[1.05] tracking-[-0.015em] text-[#0f2439] md:text-[56px]">
                Default<span className="text-[#b8973a]">.</span> Resolved<span className="text-[#b8973a]">.</span>{' '}
                On-chain<span className="text-[#b8973a]">.</span>
              </h1>
              <div className="mb-6 mt-4 h-[3px] w-[72px] rounded-sm bg-[#b8973a]" />
              <p className="text-[16px] leading-[1.75] text-[#5a7a99]">
                Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults,
                preserve the signer boundary, and export reviewable conformance receipts.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={PILOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  Discuss a pilot
                </a>
                <Link
                  href="/spec"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  View the protocol →
                </Link>
              </div>
              {/* Version badge */}
              <div
                className="mt-6 inline-flex items-center gap-2.5 rounded-md border bg-white px-4 py-2 font-mono text-[13px] text-[#0f2439]"
                style={{ borderColor: '#E4E9F2' }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#16a34a]" />
                v0.2.6 · 8 chains · 537 tests · ward_signed = False
              </div>
            </div>

            {/* Right column: Live API Status */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{ border: '1.5px solid #c8d9eb', boxShadow: '0 2px 12px rgba(15,36,57,0.08)' }}
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between"
                style={{ background: '#F9FAFC', borderBottom: '1px solid #E4E9F2', padding: '14px 20px' }}
              >
                <p
                  className="font-mono"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f2439' }}
                >
                  Live API Status
                </p>
                <span
                  className="font-mono text-[12px] font-semibold"
                  style={{ background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 20 }}
                >
                  XRPL Altnet
                </span>
              </div>

              {/* Stat rows */}
              {API_STATS.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 20px', borderBottom: '1px solid #F9FAFC' }}
                >
                  <span style={{ color: '#8a9bb0', fontSize: 13, fontWeight: 400 }}>{label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color }}>{value}</span>
                </div>
              ))}

              {/* Invariant banner */}
              <div style={{ background: '#fffdf5', borderLeft: '3px solid #b8973a', margin: '0 16px 16px', padding: '10px 12px', marginTop: 8 }}>
                <p
                  className="font-mono font-bold uppercase"
                  style={{ fontSize: 9, letterSpacing: '0.12em', color: '#b8973a' }}
                >
                  Core Invariant
                </p>
                <p className="mt-1 font-mono font-bold text-[#0f2439]" style={{ fontSize: 13 }}>
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
            {PROOF_STATS.map(({ num, suffix, label }, i) => (
              <div
                key={label}
                style={{
                  padding: '28px 20px',
                  borderRight: i < 4 ? '1px solid #F9FAFC' : undefined,
                }}
              >
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 700, color: '#0f2439', lineHeight: 1 }}>
                  {num}{suffix}
                </p>
                <p style={{ fontSize: 12, color: '#8a9bb0', marginTop: 4 }}>{label}</p>
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
