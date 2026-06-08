import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, CONFORMANCE_CHECKS, ROADMAP_PHASES } from '@/lib/wardPlatform';
import { MARKETING } from '@/lib/marketingContent';

const metrics = [
  ['8', 'Live testnet rails'],
  ['9', 'Deterministic checks'],
  ['529', 'Tests across Python, Rust, and TypeScript'],
  ['06/2026', 'Security hardening sprint'],
];

const pillars = [
  {
    title: 'Deterministic evidence',
    body: 'Ward re-reads authoritative ledger state and applies the same conformance logic every time. No discretionary operator step sits between the default event and the reviewable outcome.',
  },
  {
    title: 'Signer boundary preserved',
    body: 'Ward validates and prepares unsigned settlement instructions. Institutions sign. The chain settles. Ward never holds keys and never becomes a transaction signatory.',
  },
  {
    title: 'Built for institutional review',
    body: 'Receipts, controls, chain adapters, and default-resolution gates are packaged so engineering, risk, compliance, and capital partners can inspect the same record.',
  },
];

const institutionalReaders = [
  {
    title: 'Credit platforms',
    body: 'Ship a default path that serious lenders and capital partners can inspect before production exposure scales.',
  },
  {
    title: 'Risk and compliance teams',
    body: 'Review the evidence model, signer boundary, and operational controls without relying on informal assurances.',
  },
  {
    title: 'Institutional partners',
    body: 'Verify how conformance is produced, what evidence it depends on, and what Ward does not control.',
  },
];

const sprintHighlights = [
  '107 security and reliability fixes delivered during the June 2026 hardening sprint.',
  'ward_signed = False enforced repo-wide by replacing signing paths with unsigned transaction construction.',
  'Fail-closed controls for authentication, premium verification, and production routing assumptions.',
  'Redis-backed rate limiting and settlement locking added to reduce operational risk.',
];

export default function Home() {
  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="mx-auto grid min-h-[760px] max-w-7xl gap-14 px-6 pb-20 pt-20 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pt-24">
          <div className="relative">
            <p className="site-label">{MARKETING.eyebrow}</p>
            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[1.02] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
              {MARKETING.headline}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#d0dde0] md:text-xl">
              {MARKETING.subheadline}
            </p>

            <div className="mt-8 inline-flex rounded-full border border-[#d4a93e]/20 bg-[#d4a93e]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#f0d080]">
              {MARKETING.statusLine}
            </div>

            <div className="mt-8 max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.2)] backdrop-blur-md">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Core invariant</p>
              <p className="mt-3 text-2xl font-black text-white md:text-3xl">ward_signed = False - always.</p>
              <p className="mt-4 text-base leading-7 text-[#d0dde0]">
                Ward prepares deterministic validation and unsigned settlement instructions. Institutions sign. The chain settles. Ward is never a counterparty, never a custodian, and never a signatory.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex min-h-12 items-center rounded-full bg-[#f7f9f7] px-6 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Open demo workspace
              </Link>
              <Link
                href="/conformance"
                className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
              >
                Review Ward Conformance
              </Link>
            </div>
          </div>

          <div className="space-y-5">
            <div className="site-panel rounded-[32px] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-sm text-[#9eb0b7]">Institutional brief</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Deterministic default-resolution layer</h2>
                </div>
                <span className="rounded-full border border-[#00cc66]/20 bg-[#00cc66]/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#00cc66]">
                  v0.2.6 ready
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ['Decision source', 'Authoritative on-ledger state only'],
                  ['Review artifact', 'Shareable conformance receipt'],
                  ['Settlement role', 'Unsigned packet returned to the institution'],
                  ['Partner value', 'A default path serious counterparties can inspect'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9eb0b7]">{label}</p>
                    <p className="mt-2 text-base font-bold leading-6 text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="site-panel-muted rounded-3xl p-5">
                  <p className="font-mono text-2xl font-black text-[#f0d080]">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#d0dde0]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="site-label">Why institutions pay attention</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              Tokenized credit needs a default process that feels credible under scrutiny.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
              Ward makes default resolution inspectable. The evidence gates are explicit, the control boundary is narrow, and the result can be reviewed by engineering, risk, compliance, and capital teams without trusting hidden operator logic.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="site-panel-muted rounded-[28px] p-6">
                <h3 className="text-2xl font-black text-white">{pillar.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#d0dde0]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="site-label">Ward Conformance</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
                One institutional standard across the default path.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
                Ward Conformance means the default event, claimant eligibility, pool capacity, and settlement boundary are all tested against deterministic evidence gates. It is a technical assurance standard, not a discretionary approval layer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/conformance"
                  className="inline-flex min-h-12 items-center rounded-full bg-[#d4a93e] px-6 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105"
                >
                  Explore the conformance standard
                </Link>
                <Link
                  href="/spec"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Read the protocol specification
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {CONFORMANCE_CHECKS.map((check) => (
                <article key={check.id} className="site-panel-muted rounded-[24px] p-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">{check.id}</p>
                  <h3 className="mt-3 text-xl font-black text-white">{check.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#d0dde0]">{check.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="site-label">Live demo rails</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
                A visible multi-chain workspace for partners and developers.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
                The demo is not a marketing animation. It is an institutional workspace that shows chain selection, payload construction, conformance checks, and receipt output in a form counterparties can actually review.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {CHAIN_ADAPTERS.slice(0, 4).map((chain) => (
                  <article key={chain.id} className="site-panel-muted rounded-[24px] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-12 w-12" />
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9eb0b7]">
                        {chain.status}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-white">{chain.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#d0dde0]">{chain.proof}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="site-panel rounded-[32px] p-6 md:p-8">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Institutional readiness</p>
              <h3 className="mt-3 text-3xl font-black text-white">June 2026 hardening shifted the story from promising to reviewable.</h3>
              <p className="mt-4 text-base leading-7 text-[#d0dde0]">
                The security sprint tightened the production surface, enforced the signer boundary, and expanded the visible assurance baseline around default validation and settlement preparation.
              </p>
              <div className="mt-6 grid gap-3">
                {sprintHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-[#d0dde0]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="site-label">Who Ward is for</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
                The product narrative is built for serious counterparties.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
                The site should read clearly to institutions while staying useful for builders. The same design language now carries both: premium presentation for decision-makers and concrete detail for developers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {institutionalReaders.map((item) => (
                <article key={item.title} className="site-panel-muted rounded-[24px] p-5">
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#d0dde0]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="site-panel rounded-[32px] p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="site-label">Execution roadmap</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
                From working infrastructure to trusted market standard.
              </h2>
            </div>

            <div className="mt-10 grid gap-4">
              {ROADMAP_PHASES.map((phase) => (
                <article key={phase.phase} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 md:grid md:grid-cols-[88px_1fr_170px] md:items-start md:gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4a93e] font-mono text-lg font-black text-[#07131a]">
                    {phase.phase}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <h3 className="text-2xl font-black text-white">{phase.title}</h3>
                    <p className="mt-2 text-base leading-7 text-[#d0dde0]">{phase.headline}</p>
                    <p className="mt-3 text-sm leading-6 text-[#9eb0b7]">{phase.proof}</p>
                  </div>
                  <div className="mt-4 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#f0d080] md:mt-0 md:text-center">
                    {phase.status}
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
