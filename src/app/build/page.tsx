import type { Metadata } from 'next';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import InstallBlocks from '@/components/InstallBlocks';
import { PILOT_URL } from '@/lib/navigation';
import { CHAIN_ADAPTERS, PILOT_READINESS_PHASES } from '@/lib/wardPlatform';

export const metadata: Metadata = {
  title: 'Build With Ward | Tokenized Credit Conformance Infrastructure',
  description:
    'Integrate Ward Protocol into tokenized credit products with integration rails, SDKs, APIs, conformance receipts, and pilot readiness paths.',
  openGraph: {
    title: 'Build With Ward',
    description: 'Integrate the conformance and default-resolution layer for tokenized credit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build With Ward',
    description: 'SDKs, integration rails, conformance receipts, and pilot readiness for serious credit products.',
  },
};

export default function BuildPage() {
  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="site-label">Build</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
              Build a Ward-conformant product without giving up the signer boundary.
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-[#5a7a99] md:text-[17px]">
              Ward provides the SDK surface, API path, and chain adapters needed to ship deterministic default resolution
              without giving Ward custody or signing authority.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Open Demo
              </Link>
              <Link
                href="/spec"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Review Protocol
              </Link>
              <a
                href={PILOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-[#b8973a] px-6 py-3 text-[15px] font-semibold text-white transition hover:brightness-105"
              >
                Discuss a Pilot
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Integration surface */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Integration surface</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Start with the SDK. Finish with a conformance receipt.
            </h2>
          </div>
          <InstallBlocks />
        </div>
      </section>

      {/* Chain adapter catalog */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="max-w-xl">
              <p className="site-label">Chain adapter catalog</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Chain-native rails. One conformance result.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Each rail maps the local chain primitive into Ward&apos;s conformance engine. Your product keeps its
                settlement rail. Ward standardizes the resolution path and the institutional review surface.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CHAIN_ADAPTERS.map((chain) => (
                <article
                  key={chain.id}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <ChainLogo id={chain.logo} label={`${chain.name} rail`} className="h-12 w-12" />
                    <span
                      className="rounded-md border px-3 py-1 font-mono text-[12px] text-[#5a7a99]"
                      style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
                    >
                      {chain.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-[#0f2439]">{chain.name}</h3>
                  <p className="mt-2 font-mono text-[12px] leading-5 text-[#a7c5e5]">{chain.integrationSurface}</p>
                  <p className="mt-3 text-[13px] leading-6 text-[#5a7a99]">{chain.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilot readiness timetable */}
      <section className="site-section">
        <div className="site-container py-20">
          <div
            className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-10 lg:p-12"
            style={{ borderColor: 'rgba(167,197,229,0.4)' }}
          >
            <div className="max-w-xl">
              <p className="site-label">Pilot readiness timetable</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Phase 1–4 from self-serve review to production certification.
              </h2>
            </div>

            <div className="mt-10 grid gap-4">
              {PILOT_READINESS_PHASES.slice(0, 4).map((phase) => (
                <article
                  key={phase.phase}
                  className="rounded-xl border p-6 md:grid md:grid-cols-[88px_1fr_160px] md:gap-6 md:p-7"
                  style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-lg font-mono text-[16px] font-bold text-white"
                    style={{ background: '#b8973a' }}
                  >
                    {phase.phase}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0f2439]">{phase.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.75] text-[#5a7a99]">{phase.body}</p>
                  </div>
                  <div
                    className="mt-4 self-start rounded-md border px-4 py-2 font-mono text-[13px] font-bold text-[#b8973a] md:mt-0 md:text-center"
                    style={{ borderColor: 'rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.07)' }}
                  >
                    {phase.window}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/conformance"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Review Conformance
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Open Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
