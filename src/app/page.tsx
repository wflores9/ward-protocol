import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, PILOT_READINESS_PHASES } from '@/lib/wardPlatform';
import { MARKETING } from '@/lib/marketingContent';

const metrics = [
  ['9', 'Testnet rails'],
  ['9', 'Deterministic checks'],
  ['537', 'Tests across Python, Rust, and TypeScript'],
  ['06/2026', 'Security hardening sprint'],
];

const pillars = [
  {
    title: 'Deterministic evidence model',
    body: 'Ward re-reads authoritative ledger state and applies the same default-resolution logic every time. The result is inspectable and repeatable under institutional review.',
  },
  {
    title: 'Signer boundary preserved',
    body: 'Ward validates and prepares unsigned settlement instructions. Institutions sign. The chain settles. Ward never holds keys and never becomes a transaction signatory.',
  },
  {
    title: 'Designed for serious partners',
    body: 'Receipts, controls, rail surfaces, and on-ledger checks are packaged so engineering, risk, compliance, and capital teams can inspect the same record.',
  },
];

const audience = [
  {
    title: 'Credit platforms',
    body: 'Give lenders and counterparties a default path that looks disciplined before production capital scales.',
  },
  {
    title: 'Institutional partners',
    body: 'Verify what evidence drives default resolution and exactly where Ward stops in the operational stack.',
  },
  {
    title: 'Compliance and risk teams',
    body: 'Review a narrow, explicit control boundary instead of a discretionary black box.',
  },
];

const proofPoints = [
  'No oracle layer and no discretionary operator step in the validation path.',
  'Conformance receipts designed for partner review, not just internal debugging.',
  'June 2026 hardening tightened the production surface before institutional outreach scaled.',
];

export default function Home() {
  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container grid min-h-[920px] gap-16 pb-28 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:pt-32">
          <div className="max-w-4xl">
            <p className="site-label">{MARKETING.eyebrow}</p>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5.25rem]">
              {MARKETING.headline}
            </h1>
            <p className="site-copy mt-8 max-w-3xl text-lg md:text-[1.28rem]">
              {MARKETING.subheadline}
            </p>

            <div className="mt-8 inline-flex rounded-md border border-[#d4a93e]/18 bg-[#d4a93e]/10 px-5 py-2.5 font-mono text-sm font-bold text-[#f0d080]">
              {MARKETING.statusLine}
            </div>

            <div className="mt-10 max-w-3xl rounded-[34px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.22)] backdrop-blur-md md:p-10">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Core invariant</p>
              <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
                ward_signed = False - always.
              </p>
              <p className="site-copy mt-5">
                Ward prepares deterministic validation and unsigned settlement instructions. Institutions sign. The chain settles. Ward is never a counterparty, never a custodian, and never a signatory.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Open Demo Workspace
              </Link>
              <Link
                href="/conformance"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
              >
                Review Conformance
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="site-panel rounded-[36px] p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
                <div className="max-w-sm">
                  <p className="font-mono text-sm text-[#9eb0b7]">Institutional sandbox</p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white md:text-[2.2rem]">
                    A default-resolution layer built to be reviewed.
                  </h2>
                </div>
                <span className="rounded-md border border-[#00cc66]/20 bg-[#00cc66]/10 px-4 py-2 font-mono text-sm font-bold text-[#00cc66]">
                  v0.2.6 live
                </span>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  ['Decision source', 'Authoritative on-ledger state only'],
                  ['Review artifact', 'Shareable conformance receipt'],
                  ['Settlement role', 'Unsigned packet returned to the institution'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">{label}</p>
                    <p className="mt-3 text-lg font-bold leading-7 text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map(([value, label]) => (
                <div key={label} className="site-panel-muted rounded-[30px] p-6 md:p-7">
                  <p className="font-mono text-3xl font-black text-[#f0d080]">{value}</p>
                  <p className="mt-3 text-sm leading-7 text-[#d0dde0]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">Why institutions pay attention</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-[3.6rem]">
              Tokenized credit needs a default process that feels credible under scrutiny.
            </h2>
            <p className="site-copy mt-6 max-w-3xl">
              Ward makes default resolution inspectable. The evidence gates are explicit, the control boundary is narrow, and the outcome can be reviewed by engineering, risk, compliance, and capital teams without trusting hidden operator logic.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="site-panel-muted rounded-[32px] p-8">
                <h3 className="text-[1.75rem] font-black tracking-[-0.03em] text-white">{pillar.title}</h3>
                <p className="site-copy mt-5">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="site-label">Institutional fit</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Premium presentation for decision-makers. Real detail for builders.
              </h2>
              <p className="site-copy mt-6">
                Ward needs to read clearly to institutions while staying useful for developers. The site should feel disciplined, spacious, and deliberate rather than compressed or checklist-heavy.
              </p>
              <div className="mt-10 space-y-4">
                {proofPoints.map((point) => (
                  <div key={point} className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5 text-base leading-7 text-[#d0dde0]">
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {audience.map((item) => (
                <article key={item.title} className="site-panel-muted rounded-[30px] p-7 md:min-h-[260px]">
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="site-copy mt-5">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="max-w-3xl">
              <p className="site-label">Live demo rails</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-[3.4rem]">
                A multi-chain sandbox that feels like a real institutional workspace.
              </h2>
              <p className="site-copy mt-6">
                The demo is not a button animation. It is a visible environment for chain selection, payload construction, conformance checks, and receipt output in a form serious partners can actually review.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/demo"
                  className="inline-flex min-h-14 items-center rounded-full bg-[#d4a93e] px-7 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105"
                >
                  Enter the sandbox
                </Link>
                <Link
                  href="/build"
                  className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Build With Ward
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {CHAIN_ADAPTERS.map((chain) => (
                <article key={chain.id} className="site-panel-muted rounded-[30px] p-7">
                  <div className="flex items-start justify-between gap-4">
                    <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-14 w-14" />
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-[#9eb0b7]">
                      {chain.status}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-[-0.03em] text-white">{chain.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#d0dde0]">{chain.network}</p>
                  <p className="mt-6 text-sm leading-7 text-[#9eb0b7]">{chain.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="site-panel rounded-[38px] p-8 md:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="site-label">Execution roadmap</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Pilot readiness from self-serve review to production certification.
              </h2>
              <p className="site-copy mt-6">
                The public site now follows the same path partners will follow: inspect the standard, run the XRPL pilot lane, review cross-chain receipts, then move into mainnet readiness.
              </p>
            </div>

            <div className="mt-14 grid gap-5">
              {PILOT_READINESS_PHASES.map((phase) => (
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
          </div>
        </div>
      </section>
    </main>
  );
}
