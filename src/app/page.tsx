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

export default function Home() {
  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container pb-32 pt-24 lg:pt-40">
          <div className="mx-auto max-w-4xl text-center">
            <p className="site-label">Institutional tokenized credit · conformance standard</p>
            <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5.25rem]">
              Deterministic default-resolution infrastructure for institutional tokenized credit.
            </h1>
            <p className="site-copy mx-auto mt-8 max-w-xl text-lg md:text-[1.28rem]">
              Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults, preserve the signer boundary, and export reviewable conformance receipts.
            </p>

            <div className="mt-8 inline-flex rounded-md border border-[#d4a93e]/18 bg-[#d4a93e]/10 px-5 py-2.5 font-mono text-sm font-bold text-[#f0d080]">
              v0.2.6 · 8 chains · 537 tests · ward_signed = False
            </div>

            <div className="mx-auto mt-10 max-w-2xl rounded-[34px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-md md:p-10">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Core invariant</p>
              <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
                ward_signed = False — always.
              </p>
              <p className="site-copy mt-5">
                Ward prepares deterministic validation and unsigned settlement instructions. Institutions sign. The chain settles. Ward is never a counterparty, never a custodian, and never a signatory.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/demo"
                className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Open Demo
              </Link>
              <Link
                href="/conformance"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
              >
                Review Conformance
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="max-w-xl">
            <p className="site-label">The standard</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Tokenized credit needs a default process that holds up under scrutiny.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="site-panel-muted rounded-[32px] p-8">
                <h3 className="text-[1.75rem] font-black tracking-[-0.03em] text-white">{pillar.title}</h3>
                <p className="site-copy mt-5 max-w-xl">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="site-panel rounded-[38px] p-8 md:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="site-label">Pilots open now</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Ward Protocol is pre-mainnet. Pilots open now.
              </h2>
              <p className="site-copy mx-auto mt-6 max-w-xl">
                Run the conformance demo, inspect the evidence surface, and book a pilot call when you are ready.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/demo"
                  className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
                >
                  Enter the Demo
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
        </div>
      </section>
    </main>
  );
}
