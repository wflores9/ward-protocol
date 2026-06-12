import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ward Use Cases | Tokenized Credit Conformance Infrastructure',
  description:
    'How Ward Protocol becomes the conformance and default-resolution layer for lenders, vault operators, credit protocols, escrow providers, custodians, and DeFi platforms.',
  openGraph: {
    title: 'Ward Use Cases',
    description: 'Default resolution and conformance infrastructure for institutional tokenized credit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Use Cases',
    description: 'Six institution types. One conformance standard.',
  },
};

const USE_CASES = [
  {
    id: 'lenders',
    eyebrow: 'Lenders',
    title: 'Validate borrower defaults before liquidation.',
    problem:
      'Liquidating against a defaulted borrower requires manual verification, legal review, and operational escalation. The process is slow, inconsistent, and hard to audit after the fact.',
    ward:
      'Ward runs nine deterministic on-ledger checks when the default flag is set. If every check passes, an unsigned settlement packet is returned. If any check fails, the rejection reason is verifiable on-chain.',
    outcome: 'A conformance receipt becomes admissible evidence for the default event — no reconstruction required.',
  },
  {
    id: 'vault-operators',
    eyebrow: 'Vault Operators',
    title: 'Policy NFT enforces vault rules. No manual override possible.',
    problem:
      'Vault rule enforcement depends on human operators reading policy documents and applying judgment at the moment of default. Rules drift. Judgment varies. Audit trails disappear.',
    ward:
      'The policy NFT encodes vault rules on-chain. Ward validates every claim against the policy artifact before a settlement packet is constructed. The rule is the NFT — not the operator\'s interpretation of it.',
    outcome: 'Every default resolves through the same machine-readable rule set. Same vault, same outcome, every time.',
  },
  {
    id: 'credit-protocols',
    eyebrow: 'Credit Protocols',
    title: 'Chain-agnostic conformance across all DeFi lending pools.',
    problem:
      'Each lending pool has different default handling logic. Cross-chain conformance is impossible to standardize. Institutional LPs cannot compare receipts across pools.',
    ward:
      'A single conformance standard operates across all supported chains. The same nine checks run regardless of the underlying primitive — XRPL NFT, Soroban contract, or EVM resolver.',
    outcome: 'One conformance receipt format works across every integrated DeFi lending pool.',
  },
  {
    id: 'escrow-providers',
    eyebrow: 'Escrow Providers',
    title: 'Deterministic release conditions. Ward validates all conditions before release.',
    problem:
      'Escrow release conditions are written in legal documents, not enforced on-chain. Dispute resolution falls back to arbitration at the moment certainty matters most.',
    ward:
      'Release conditions are registered before capital moves. Ward validates all conditions against authoritative ledger state before returning unsigned release instructions. The institution signs; the chain settles.',
    outcome: 'Deterministic release — no arbiter, no Ward key, no judgment call.',
  },
  {
    id: 'custodians',
    eyebrow: 'Custodians',
    title: 'Signer boundary proof: Ward never holds keys, never signs.',
    problem:
      'Custodians cannot participate in DeFi default resolution without taking signing control, which creates custody exposure and regulatory liability they cannot accept.',
    ward:
      'Ward never holds keys and never signs transactions. The signer boundary proof is machine-checked on every CI push via TLA+ model and signing boundary scanner. Custodians retain full signing authority throughout.',
    outcome: 'Full audit trail. Zero Ward custody. ward_signed = False — always.',
  },
  {
    id: 'defi-platforms',
    eyebrow: 'DeFi Platforms',
    title: 'Plug-in conformance layer. Any chain, any lending primitive.',
    problem:
      'Building default resolution into a lending platform requires protocol-specific logic for every supported chain and asset class. Maintenance cost compounds with every new rail.',
    ward:
      'A plug-in conformance layer works on any supported chain and any lending primitive. The integration surface is a single SDK or API endpoint that returns a standardized conformance receipt.',
    outcome: 'Ship a conformant lending product on day one, across any supported rail, without rebuilding resolution logic.',
  },
];

export default function UseCasesPage() {
  return (
    <main className="site-shell use-cases-page">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="site-label">Use cases</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
              Six institution types. One conformance standard.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-[#5a7a99]">
              Ward gives tokenized credit a standard answer to the hardest question: what happens when something goes
              wrong? The answer is deterministic, auditable, and never dependent on Ward holding a key.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Open Demo
              </Link>
              <Link
                href="/build"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Build With Ward →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Six use-case cards */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="use-case-grid">
            {USE_CASES.map((uc) => (
              <article
                key={uc.id}
                className="use-case-card flex flex-col rounded-xl border bg-white shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                {/* Gold accent bar */}
                <div className="mb-5 h-[3px] w-7 rounded-sm bg-[#b8973a]" />

                {/* Eyebrow */}
                <p className="use-case-eyebrow font-mono font-bold uppercase text-[#6f849b]">
                  {uc.eyebrow}
                </p>

                {/* Title */}
                <h2 className="use-case-title mt-4 font-semibold text-[#0f2439]">{uc.title}</h2>

                {/* Problem */}
                <div className="mt-5">
                  <p
                    className="use-case-kicker mb-2 font-mono font-bold uppercase"
                    style={{ color: '#dc2626' }}
                  >
                    Without Ward
                  </p>
                  <p className="use-case-copy text-[#4f667c]">{uc.problem}</p>
                </div>

                {/* Ward solution */}
                <div className="mt-4">
                  <p
                    className="use-case-kicker mb-2 font-mono font-bold uppercase"
                    style={{ color: '#16a34a' }}
                  >
                    With Ward
                  </p>
                  <p className="use-case-copy text-[#4f667c]">{uc.ward}</p>
                </div>

                {/* Outcome */}
                <div
                  className="mt-5 rounded-lg p-4"
                  style={{ background: 'rgba(184,151,58,0.07)', borderLeft: '3px solid #b8973a' }}
                >
                  <p className="use-case-outcome text-[#0f2439]">{uc.outcome}</p>
                </div>

                {/* CTA */}
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(167,197,229,0.28)' }}>
                  <Link
                    href="/demo"
                    className="use-case-link font-mono font-semibold text-[#2a5f9e] transition hover:text-[#0f2439]"
                  >
                    See how it works →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section">
        <div className="site-container py-20">
          <div
            className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-10"
            style={{ borderColor: 'rgba(167,197,229,0.4)' }}
          >
            <div className="max-w-2xl">
              <p className="site-label">Ready to build?</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                The default path should be as engineered as the lending product.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Ward Protocol is not a button, a bot, or a back-office workaround. It is the resolution layer
                institutions can build around — before capital scales.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  Open Demo
                </Link>
                <Link
                  href="/build"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Protocol + Build
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
