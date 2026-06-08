import type { Metadata } from 'next';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, CONFORMANCE_CHECKS } from '@/lib/wardPlatform';

export const metadata: Metadata = {
  title: 'Ward Docs | Conformance Integration Guide',
  description:
    'Developer documentation for Ward Protocol: SDK setup, adapter lanes, nine-check conformance validation, unsigned settlement packets, and receipt export.',
  openGraph: {
    title: 'Ward Protocol Developer Docs',
    description: 'Integrate deterministic default resolution into tokenized credit products.',
    images: [{ url: '/brand/ward-banner.png', width: 1920, height: 480 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol Developer Docs',
    description: 'SDK setup, chain adapters, conformance validation, and receipt export.',
  },
};

const quickstart = `import { WardClient } from '@wardprotocol/sdk'

const ward = new WardClient({
  chain: 'xrpl',
  network: 'altnet',
  institutionKey: process.env.WARD_INSTITUTION_KEY,
})

const result = await ward.runConformance({
  policyRef: 'NFTokenTaxon=281',
  claimantAddress: wallet.address,
  vaultId: vault.id,
  claimContext: defaultEvent.id,
})

if (result.conformant) {
  // Ward returns an unsigned settlement packet.
  // Your institution signs. The chain settles.
  assert(result.wardSigned === false)
}`;

const receiptPreview = `receipt_id: WARD-7A21F0
result: WARD_CONFORMANT
checks_passed: 9/9
decision_source: on_ledger_state
settlement_packet: unsigned
signer_boundary: institution
ward_signed: false`;

const docsSections = [
  ['Adapter setup', 'Select a chain lane and bind Ward to the project primitive your credit product already uses.'],
  ['Conformance payload', 'Send the policy reference, claimant, vault, and default context to the Ward validation engine.'],
  ['Validation response', 'Receive approved or rejected status, check-level evidence, and a deterministic reason.'],
  ['Settlement packet', 'Use the unsigned packet to preserve custody and signing authority inside your institution.'],
];

export default function DocsPage() {
  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] px-6 py-20 text-[#f7faf8] md:px-10 lg:px-12">
        <img src="/brand/ward-banner.png" alt="Ward Protocol documentation" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[#14242b]/90" />
        <div className="absolute inset-0 grid-overlay" />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-mono text-sm font-bold text-[#d4a93e]">Developer Documentation</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Integrate the Ward conformance engine into your credit product.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
            These docs show how to attach adapters, run nine on-ledger checks, preserve the signer boundary, and export receipts for institutional review.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">
              Open Console
            </Link>
            <Link href="/spec" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">
              Read Spec
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Quickstart</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              One call returns the evidence your product needs.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              Ward does not replace your protocol. It gives your protocol a deterministic default-resolution path that serious counterparties can inspect.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-[#14242b]/20 bg-[#101d23] p-5 font-mono text-sm leading-7 text-[#d2e1dd]">
            <code>{quickstart}</code>
          </pre>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Documentation map</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Build the integration in four reviewable surfaces.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {docsSections.map(([title, body], index) => (
              <article key={title} className="rounded-lg border border-[#14242b]/10 bg-white p-5">
                <p className="font-mono text-sm font-bold text-[#9b6d13]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-4 text-xl font-black text-[#14242b]">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[#52665f]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#14242b] py-16 text-[#f7faf8]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Adapter matrix</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Pick the chain lane. Keep the Ward invariant.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d2e1dd]">
              Each adapter translates a chain-native primitive into the same conformance result: approved, rejected, evidence, and unsigned settlement instructions.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHAIN_ADAPTERS.map((chain) => (
              <article key={chain.id} className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
                <div className="mb-4 flex items-center gap-4">
                  <ChainLogo id={chain.logo} label={`${chain.name} adapter`} className="h-12 w-12" />
                  <div>
                    <h3 className="text-lg font-black text-[#f7faf8]">{chain.name}</h3>
                    <p className="text-sm leading-5 text-[#a9bdb8]">{chain.network}</p>
                  </div>
                </div>
                <p className="font-mono text-sm leading-6 text-[#d2e1dd]">{chain.endpoint}</p>
                <p className="mt-3 text-base leading-7 text-[#d2e1dd]">{chain.primitive}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[1fr_380px] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Nine-check conformance</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              The validation engine is explainable at check level.
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {CONFORMANCE_CHECKS.map((check) => (
                <article key={check.id} className="rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-4">
                  <p className="font-mono text-sm font-bold text-[#9b6d13]">{check.id}</p>
                  <h3 className="mt-3 text-lg font-black leading-6 text-[#14242b]">{check.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#52665f]">{check.description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#14242b]/20 bg-[#101d23] p-5 text-[#f7faf8]">
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Receipt shape</p>
            <pre className="mt-5 whitespace-pre-wrap font-mono text-sm leading-7 text-[#d2e1dd]">{receiptPreview}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
