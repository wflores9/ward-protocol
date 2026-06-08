import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, CONFORMANCE_CHECKS, INTEGRATION_PROFILES, ROADMAP_PHASES } from '@/lib/wardPlatform';
import { MARKETING } from '@/lib/marketingContent';

const metrics = [
  ['436+', 'Python tests passing'],
  ['8', 'Testnet rails'],
  ['9', 'On-ledger checks'],
  ['0', 'Ward signing keys'],
];

const proofPillars = [
  {
    title: 'Not a demo',
    body: 'Ward is packaged as an integration layer: adapter, API, SDK, conformance receipt, and signer-boundary proof.',
  },
  {
    title: 'Not an oracle',
    body: 'Ward does not decide the outcome. It re-reads authoritative ledger state and returns a deterministic result.',
  },
  {
    title: 'Not a claims app',
    body: 'Ward sits underneath credit products as the resolution standard institutions can review before capital moves.',
  },
];

const buyerModes = [
  {
    title: 'Institutional risk teams',
    body: 'Review a deterministic default path before approving tokenized credit exposure.',
  },
  {
    title: 'Protocol engineering teams',
    body: 'Integrate the adapter, run conformance, and preserve your own signing boundary.',
  },
  {
    title: 'Capital allocators',
    body: 'Inspect a receipt that shows exactly which ledger facts allowed or rejected a claim.',
  },
];

export default function Home() {
  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] text-[#f7faf8]">
        <div className="absolute inset-0 grid-overlay opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(182,215,206,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(212,169,62,0.08),transparent_34%)]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-10 lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#d4a93e]">{MARKETING.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              {MARKETING.headline}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
              {MARKETING.subheadline}
            </p>

            <div className="mt-8 rounded-lg border-l-4 border-[#d4a93e] bg-[#f7faf8]/10 p-5">
              <p className="font-mono text-base font-bold text-[#d4a93e]">ward_signed = False</p>
              <p className="mt-2 text-base leading-7 text-[#d2e1dd]">
                Ward prepares validation and settlement instructions. Institutions sign. The chain settles. Ward never holds keys, signs, or decides outcomes.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">
                Open Integration Console
              </Link>
              <Link href="/build" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">
                Build With Ward
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#0f1f25]/90 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#b6d7ce]/10 pb-4">
              <div>
                <p className="font-mono text-sm text-[#a9bdb8]">Ward Conformance Receipt</p>
                <h2 className="mt-1 text-2xl font-black text-[#f7faf8]">Tokenized Credit Vault</h2>
              </div>
              <span className="rounded-md border border-[#00cc66]/30 bg-[#00cc66]/10 px-3 py-1.5 font-mono text-sm font-bold text-[#00cc66]">
                READY
              </span>
            </div>

            <div className="grid gap-3">
              {[
                ['Resolution layer', 'Default validation and unsigned settlement packet'],
                ['Decision source', 'On-ledger state only'],
                ['Signer boundary', 'Institution signs every settlement action'],
                ['Audit artifact', 'Shareable conformance receipt'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-4">
                  <p className="font-mono text-sm text-[#a9bdb8]">{label}</p>
                  <p className="mt-2 text-base font-bold leading-6 text-[#f7faf8]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-md bg-[#101d23] p-3 text-center">
                  <p className="font-mono text-xl font-black text-[#d4a93e]">{value}</p>
                  <p className="mt-1 text-sm leading-5 text-[#a9bdb8]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#14242b]/10 bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-3 md:px-10 lg:px-12">
          {proofPillars.map((pillar) => (
            <article key={pillar.title} className="rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-6">
              <h2 className="text-2xl font-black text-[#14242b]">{pillar.title}</h2>
              <p className="mt-3 text-base leading-7 text-[#52665f]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">The billion-dollar wedge</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Serious credit markets need a resolution standard before serious capital arrives.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              Ward makes the default path inspectable by compliance, engineering, risk, and capital partners. The outcome is deterministic, the evidence is on-ledger, and the signer boundary remains clean.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {buyerModes.map((mode) => (
              <article key={mode.title} className="rounded-lg border border-[#14242b]/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-[#14242b]">{mode.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#52665f]">{mode.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#b6d7ce]/10 bg-[#14242b] py-16 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Multi-chain testnet rails</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                One conformance model across eight testnet rails.
              </h2>
            </div>
            <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">
              Run a Console Session
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHAIN_ADAPTERS.map((chain) => (
              <article key={chain.id} className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-14 w-14" />
                  <span className="rounded-md border border-[#b6d7ce]/20 px-3 py-1.5 font-mono text-sm font-bold text-[#d4a93e]">
                    {chain.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-[#f7faf8]">{chain.name}</h3>
                <p className="mt-2 text-base leading-7 text-[#d2e1dd]">{chain.network}</p>
                <p className="mt-3 text-sm leading-6 text-[#a9bdb8]">{chain.proof}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Self-demo without role play</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              The demo is now an integration console, not a button animation.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              Create a sandbox wallet, select an integration rail, choose a project profile, run the conformance engine, and export the receipt. It shows how Ward plugs into a real credit product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#14242b] px-6 py-3 text-base font-bold text-white transition hover:bg-[#1d3035]">
                Open the Console
              </Link>
              <Link href="/docs" className="inline-flex min-h-12 items-center rounded-md border border-[#14242b]/20 px-6 py-3 text-base font-bold text-[#14242b] transition hover:border-[#14242b]/40 hover:bg-[#14242b]/5">
                Read Integration Docs
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {INTEGRATION_PROFILES.map((profile) => (
              <article key={profile.id} className="rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-black text-[#14242b]">{profile.name}</h3>
                  <span className="rounded-md border border-[#14242b]/10 bg-white px-3 py-1.5 font-mono text-sm font-bold text-[#3f534d]">
                    {profile.value}
                  </span>
                </div>
                <p className="text-base leading-7 text-[#52665f]">{profile.integrationGoal}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Conformance engine</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Every default is processed through the same nine evidence gates.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {CONFORMANCE_CHECKS.map((check) => (
              <article key={check.id} className="rounded-lg border border-[#14242b]/10 bg-white p-5">
                <p className="font-mono text-sm font-bold text-[#9b6d13]">{check.id}</p>
                <h3 className="mt-3 text-lg font-black leading-6 text-[#14242b]">{check.label}</h3>
                <p className="mt-2 text-base leading-7 text-[#52665f]">{check.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#14242b] py-16 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Roadmap to category leadership</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              From working infrastructure to trusted market standard.
            </h2>
          </div>
          <div className="grid gap-4">
            {ROADMAP_PHASES.map((phase) => (
              <article key={phase.phase} className="grid gap-4 rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5 md:grid-cols-[88px_1fr_180px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#d4a93e] font-mono text-lg font-black text-[#14242b]">
                  {phase.phase}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#f7faf8]">{phase.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#d2e1dd]">{phase.headline}</p>
                  <p className="mt-3 text-sm leading-6 text-[#a9bdb8]">{phase.proof}</p>
                </div>
                <div className="self-start rounded-md border border-[#b6d7ce]/20 px-4 py-2 font-mono text-sm font-bold text-[#d4a93e] md:text-center">
                  {phase.status}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-mono text-sm font-bold text-[#9b6d13]">Ward Center Stage</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
            If you are building tokenized credit, Ward is the default-resolution layer you need before serious capital can trust your system.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#14242b] px-6 py-3 text-base font-bold text-white transition hover:bg-[#1d3035]">
              Self-Demo Ward
            </Link>
            <a href="https://cal.com/wardprotocol/30min" className="inline-flex min-h-12 items-center rounded-md border border-[#14242b]/20 px-6 py-3 text-base font-bold text-[#14242b] transition hover:border-[#14242b]/40 hover:bg-[#14242b]/5">
              Discuss a Pilot
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
