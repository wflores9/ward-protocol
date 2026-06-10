import type { Metadata } from 'next';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import { CHAIN_ADAPTERS, CONFORMANCE_CHECKS } from '@/lib/wardPlatform';

export const metadata: Metadata = {
  title: 'Ward Docs | Conformance Integration Guide',
  description:
    'Developer documentation for Ward Protocol: SDK setup, integration rails, nine-check conformance validation, unsigned settlement packets, and receipt export.',
  openGraph: {
    title: 'Ward Protocol Developer Docs',
    description: 'Integrate deterministic default resolution into tokenized credit products.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol Developer Docs',
    description: 'SDK setup, integration rails, conformance validation, and receipt export.',
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
  ['Rail setup', 'Select a chain lane and bind Ward to the project primitive your credit product already uses.'],
  ['Conformance payload', 'Send the policy reference, claimant, vault, and default context to the Ward validation engine.'],
  ['Validation response', 'Receive approved or rejected status, check-level evidence, and a deterministic reason.'],
  ['Settlement packet', 'Use the unsigned packet to preserve custody and signing authority inside your institution.'],
];

export default function DocsPage() {
  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="site-label">Developer Documentation</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
              Integrate the Ward conformance engine into your credit product.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-[#5a7a99]">
              These docs show how to select integration rails, run nine on-ledger checks, preserve the signer boundary,
              and export receipts for institutional review.
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
                Read Spec
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quickstart */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="site-label">Quickstart</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                One call returns the evidence your product needs.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Ward does not replace your protocol. It gives your protocol a deterministic default-resolution path that
                serious counterparties can inspect.
              </p>
            </div>
            <pre
              className="overflow-x-auto rounded-xl p-5 font-mono text-[13px] leading-7"
              style={{
                background: '#1a2f3f',
                border: '1px solid rgba(167,197,229,0.15)',
                color: '#c8dce8',
              }}
            >
              <code>{quickstart}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Documentation map */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Documentation map</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Build the integration in four reviewable surfaces.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {docsSections.map(([title, body], index) => (
              <article
                key={title}
                className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                style={{ borderColor: '#E4E9F2' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 text-[17px] font-semibold text-[#0f2439]">{title}</h3>
                <p className="mt-3 text-[13px] leading-[1.7] text-[#5a7a99]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Chain rail matrix */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="site-label">Integration rail matrix</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Pick the chain lane. Keep the Ward invariant.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Each rail translates a chain-native primitive into the same conformance result: approved, rejected,
                evidence, and unsigned settlement instructions.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CHAIN_ADAPTERS.map((chain) => (
                <article
                  key={chain.id}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                  style={{ borderColor: '#E4E9F2' }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <ChainLogo id={chain.logo} label={`${chain.name} rail`} className="h-10 w-10" />
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0f2439]">{chain.name}</h3>
                      <p className="text-[12px] text-[#8a9bb0]">{chain.network}</p>
                    </div>
                  </div>
                  <p className="font-mono text-[12px] font-semibold text-[#a7c5e5]">{chain.status}</p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[#5a7a99]">{chain.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nine-check conformance + receipt */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="site-label">Nine-check conformance</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                The validation engine is explainable at check level.
              </h2>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {CONFORMANCE_CHECKS.map((check) => (
                  <article
                    key={check.id}
                    className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                    style={{ borderColor: '#E4E9F2' }}
                  >
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                      {check.id}
                    </p>
                    <h3 className="mt-3 text-[14px] font-semibold leading-snug text-[#0f2439]">{check.label}</h3>
                    <p className="mt-2 text-[12px] leading-[1.65] text-[#5a7a99]">{check.description}</p>
                  </article>
                ))}
              </div>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: '#1a2f3f', border: '1px solid rgba(167,197,229,0.15)' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                Receipt shape
              </p>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-[13px] leading-7 text-[#c8dce8]">
                {receiptPreview}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
