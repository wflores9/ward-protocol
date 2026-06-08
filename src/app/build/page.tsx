import type { Metadata } from 'next';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, ROADMAP_PHASES } from '@/lib/wardPlatform';

export const metadata: Metadata = {
  title: 'Build With Ward | Tokenized Credit Conformance Infrastructure',
  description:
    'Integrate Ward Protocol into tokenized credit products with chain adapters, SDKs, APIs, conformance receipts, and pilot readiness paths.',
  openGraph: {
    title: 'Build With Ward',
    description: 'Integrate the conformance and default-resolution layer for tokenized credit.',
    images: [{ url: '/brand/ward-banner.png', width: 1920, height: 480 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build With Ward',
    description: 'SDKs, chain adapters, conformance receipts, and pilot readiness for serious credit products.',
  },
};

const installBlocks = [
  {
    label: 'Python SDK',
    command: 'pip install ward-protocol==0.2.6',
    body: 'Use the Python SDK for validator services, vault monitors, conformance jobs, and institutional backend flows.',
  },
  {
    label: 'TypeScript SDK',
    command: 'npm install @wardprotocol/sdk',
    body: 'Use the TypeScript SDK for product consoles, dashboards, adapter orchestration, and receipt export.',
  },
  {
    label: 'Hosted API',
    command: 'https://api.wardprotocol.org',
    body: 'Use the hosted API for pilot integrations where teams want Ward-managed infrastructure and enterprise onboarding.',
  },
];

const buildSteps = [
  ['01', 'Attach adapter', 'Choose the chain lane and bind Ward to the project primitive your vault already uses.'],
  ['02', 'Register policy reference', 'Map the policy artifact, vault state, claimant identity, and settlement boundary.'],
  ['03', 'Run conformance', 'Execute the nine deterministic checks against authoritative ledger state.'],
  ['04', 'Export receipt', 'Share the validation result with engineering, risk, compliance, and capital partners.'],
];

export default function BuildPage() {
  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] px-6 py-20 text-[#f7faf8] md:px-10 lg:px-12">
        <img src="/brand/ward-banner.png" alt="Ward Protocol builder infrastructure" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[#14242b]/90" />
        <div className="absolute inset-0 grid-overlay" />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-mono text-sm font-bold text-[#d4a93e]">Build With Ward</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Make your tokenized credit product Ward-conformant.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
            Ward gives builders the adapter layer, API path, SDK surface, and receipt model needed to ship deterministic default resolution without giving Ward custody or signing authority.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">
              Open Integration Console
            </Link>
            <a href="https://cal.com/wardprotocol/30min" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">
              Discuss a Pilot
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Integration surface</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Start with the SDK. Finish with a conformance receipt.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {installBlocks.map((block) => (
              <article key={block.label} className="rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-6">
                <p className="font-mono text-sm font-bold text-[#9b6d13]">{block.label}</p>
                <pre className="mt-4 overflow-x-auto rounded-md bg-[#101d23] p-4 font-mono text-sm leading-7 text-[#d2e1dd]">
                  <code>{block.command}</code>
                </pre>
                <p className="mt-4 text-base leading-7 text-[#52665f]">{block.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Adapter catalog</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Chain-native primitives. One Ward result.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              Each adapter maps the local chain primitive into Ward's conformance engine. Your product keeps its settlement rail. Ward standardizes the resolution path.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHAIN_ADAPTERS.map((chain) => (
              <article key={chain.id} className="rounded-lg border border-[#14242b]/10 bg-white p-5">
                <div className="mb-4 flex items-center gap-4">
                  <ChainLogo id={chain.logo} label={`${chain.name} adapter`} className="h-12 w-12" />
                  <div>
                    <h3 className="text-lg font-black text-[#14242b]">{chain.name}</h3>
                    <p className="text-sm leading-5 text-[#52665f]">{chain.status}</p>
                  </div>
                </div>
                <p className="font-mono text-sm leading-6 text-[#3f534d]">{chain.adapterPackage}</p>
                <p className="mt-3 text-base leading-7 text-[#52665f]">{chain.primitive}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#14242b] py-16 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Implementation path</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Four steps from integration to institutional review.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {buildSteps.map(([step, title, body]) => (
              <article key={step} className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">{step}</p>
                <h3 className="mt-4 text-xl font-black text-[#f7faf8]">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#d2e1dd]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Pilot readiness</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Ward is moving from testnet-proven infrastructure into pilots and mainnet readiness.
            </h2>
          </div>
          <div className="grid gap-4">
            {ROADMAP_PHASES.map((phase) => (
              <article key={phase.phase} className="grid gap-4 rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-5 md:grid-cols-[76px_1fr_170px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#14242b] font-mono text-base font-black text-white">
                  {phase.phase}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#14242b]">{phase.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#52665f]">{phase.headline}</p>
                </div>
                <p className="self-start rounded-md border border-[#14242b]/10 bg-white px-4 py-2 font-mono text-sm font-bold text-[#3f534d] md:text-center">
                  {phase.status}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
