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
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container pb-32 pt-24 lg:pt-32">
          <div className="max-w-3xl">
            <p className="site-label">Build</p>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5rem]">
              Build a Ward-conformant product without giving up the signer boundary.
            </h1>
            <p className="site-copy mt-8 max-w-xl text-lg md:text-[1.2rem]">
              Ward provides the SDK surface, API path, and chain adapters needed to ship deterministic default resolution without giving Ward custody or signing authority.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Open Demo
              </Link>
              <Link
                href="/spec"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
              >
                Review Protocol
              </Link>
              <a
                href={PILOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center rounded-full bg-[#d4a93e] px-7 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105"
              >
                Discuss a Pilot
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="max-w-xl">
            <p className="site-label">Integration surface</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Start with the SDK. Finish with a conformance receipt.
            </h2>
          </div>
          <InstallBlocks />
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="max-w-xl">
              <p className="site-label">Chain adapter catalog</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Chain-native rails. One conformance result.
              </h2>
              <p className="site-copy mt-6">
                Each rail maps the local chain primitive into Ward&apos;s conformance engine. Your product keeps its settlement rail. Ward standardizes the resolution path and the institutional review surface.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {CHAIN_ADAPTERS.map((chain) => (
                <article key={chain.id} className="site-panel-muted rounded-[30px] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <ChainLogo id={chain.logo} label={`${chain.name} rail`} className="h-14 w-14" />
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-[#9eb0b7]">
                      {chain.status}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-white">{chain.name}</h3>
                  <p className="mt-3 font-mono text-sm leading-6 text-[#d0dde0]">{chain.integrationSurface}</p>
                  <p className="mt-4 text-sm leading-7 text-[#9eb0b7]">{chain.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="site-panel rounded-[38px] p-8 md:p-10 lg:p-12">
            <div className="max-w-xl">
              <p className="site-label">Pilot readiness timetable</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Phase 1–4 from self-serve review to production certification.
              </h2>
            </div>

            <div className="mt-14 grid gap-5">
              {PILOT_READINESS_PHASES.slice(0, 4).map((phase) => (
                <article
                  key={phase.phase}
                  className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:grid md:grid-cols-[100px_1fr_180px] md:gap-6 md:p-7"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#d4a93e] font-mono text-lg font-black text-[#07131a]">
                    {phase.phase}
                  </div>
                  <div className="mt-5 md:mt-0">
                    <h3 className="text-2xl font-black tracking-[-0.03em] text-white">{phase.title}</h3>
                    <p className="site-copy mt-3">{phase.body}</p>
                  </div>
                  <div className="mt-5 self-start rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm font-bold text-[#f0d080] md:mt-0 md:text-center">
                    {phase.window}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/conformance"
                className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Review Conformance
              </Link>
              <Link
                href="/demo"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
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
