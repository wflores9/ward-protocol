import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ward Protocol Specification | Deterministic Default Resolution',
  description:
    'Technical specification for Ward Protocol: conformance architecture, nine on-ledger checks, signer-boundary guarantees, settlement packets, and attack-vector mitigations.',
  openGraph: {
    title: 'Ward Protocol Specification',
    description: 'The technical basis for deterministic default resolution in tokenized credit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol Specification',
    description: 'Nine on-ledger checks, unsigned settlement packets, and signer-boundary proof.',
  },
};

const CLAIM_STEPS = [
  'NFT existence and taxon enforcement (WARD_POLICY_TAXON = 281)',
  'Policy validity using XRPL ledger close_time, never server clock',
  'Vault address binding: metadata vault must equal defaulted_vault',
  'LSF_LOAN_DEFAULT flag on LedgerEntry(index=loan_id)',
  'Vault loss must be greater than zero drops',
  'Pool usable balance must exceed the validated loss amount',
  'Replay protection: policy NFT must still be live',
  'Claimant must still hold the policy NFT on ledger',
  'Pool solvency and rate limits must still hold at settlement',
] as const;

const ARCHITECTURE = [
  ['Module 1', 'WardClient', 'High-level SDK entrypoint for institutions and integrators.'],
  ['Module 2', 'VaultMonitor', 'WebSocket default detection with authoritative ledger re-verification.'],
  ['Module 3', 'ClaimValidator', 'Nine-step deterministic on-chain claim validation.'],
  ['Module 4', 'EscrowSettlement', 'Unsigned escrow lifecycle for controlled institutional execution.'],
  ['Module 5', 'PoolHealthMonitor', 'Coverage ratio and reserve accounting for pool safety.'],
] as const;

const SPEC_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    body:
      'Ward Protocol is an open specification and SDK for deterministic default protection on institutional lending vaults. Core invariant: ward_signed = False. Ward constructs unsigned transactions. Institutions sign. The chain settles. Ward never holds, touches, or stores private keys.',
  },
  {
    id: 'vault-monitor',
    title: 'Vault monitor',
    body:
      'VaultMonitor subscribes to XRPL ledger events over TLS, treats incoming transaction messages as hints only, and confirms default through independent LedgerEntry reads. Default status is only promoted after repeated authoritative confirmation.',
  },
  {
    id: 'escrow',
    title: 'Escrow settlement',
    body:
      'Ward never receives the claimant preimage. Institutions sign EscrowCreate, claimants sign EscrowFinish, and policy NFTs are burned on settlement to prevent replay. ward_signed = False is preserved across the entire settlement path.',
  },
  {
    id: 'shared-surface',
    title: 'Shared implementation surface',
    body:
      'Shared primitives live in ward/primitives.py, ward/constants.py, and ward/tx_builder.py so address validation, reserve accounting, payload construction, and signer-boundary guarantees stay consistent across the protocol surface.',
  },
] as const;

const ATTACK_VECTORS = [
  'Policy forgery blocked by taxon enforcement at step 1.',
  'Replay and double-spend blocked by burn-on-settlement plus re-checking live NFT status.',
  'Clock manipulation removed by relying on XRPL ledger close_time.',
  'Signal manipulation reduced by independent LedgerEntry reads for every event.',
  'Front-running risk narrowed because Ward never stores or receives preimages.',
  'Pool drainage risk constrained through dual solvency and coverage checks.',
  'Address injection blocked by validate_xrpl_address() at API boundaries.',
  'Silent network failure constrained through heartbeat monitoring and reconnect logic.',
] as const;

const CONSTANTS = [
  ['WARD_POLICY_TAXON', '281'],
  ['WARD_CREDENTIAL_TAXON', '282'],
  ['TF_BURNABLE', '0x00000001'],
  ['LSF_LOAN_DEFAULT', '0x00010000'],
  ['MIN_COVERAGE_RATIO', '1.5'],
  ['CLAIM_RATE_LIMIT_MAX', '3'],
  ['CLAIM_RATE_LIMIT_WINDOW_S', '300'],
  ['MONITOR_HEARTBEAT_TIMEOUT_S', '60'],
  ['XRPL_BASE_RESERVE_DROPS', '2_000_000'],
  ['XRPL_OWNER_RESERVE_DROPS', '200_000'],
] as const;

export default function SpecPage() {
  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container pb-28 pt-24 lg:pt-32">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-4xl">
              <p className="site-label">Protocol specification</p>
              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5rem]">
                The technical basis for deterministic default resolution.
              </h1>
              <p className="site-copy mt-8 max-w-3xl text-lg md:text-[1.2rem]">
                This page is the engineering reference for Ward Protocol: architecture, claim validation, signer-boundary guarantees, settlement behavior, and the controls that make conformance reviewable.
              </p>

              <div className="mt-9 flex flex-wrap gap-3 text-sm text-[#d0dde0]">
                {['9 on-ledger checks', '15 attack vectors mitigated', 'ward_signed = False', 'SDK v0.2.6'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono">
                    {item}
                  </span>
                ))}
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
                <Link
                  href="/build"
                  className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Build With Ward
                </Link>
              </div>
            </div>

            <div className="site-panel rounded-[38px] p-8 md:p-10">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Specification snapshot</p>
              <div className="mt-6 grid gap-4">
                {[
                  ['Core invariant', 'ward_signed = False'],
                  ['Decision source', 'Authoritative on-ledger state only'],
                  ['Settlement role', 'Ward returns unsigned payloads only'],
                  ['Primary assurance surface', 'Nine-step claim validation'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">{label}</p>
                    <p className="mt-3 text-lg font-bold leading-7 text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">Architecture</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Five modules form the conformance and settlement surface.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-5">
            {ARCHITECTURE.map(([step, title, body]) => (
              <article key={title} className="site-panel-muted rounded-[30px] p-6 lg:min-h-[260px]">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#d4a93e]">{step}</p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">{title}</h3>
                <p className="site-copy-sm mt-4">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-14 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="max-w-2xl">
              <p className="site-label">Claim validation</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Nine deterministic checks govern every claim.
              </h2>
              <p className="site-copy mt-6">
                These steps are intentionally explicit. They define the evidence path institutions can inspect and the basis for every conformant result.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CLAIM_STEPS.map((step, index) => (
                <article key={step} className="site-panel rounded-[28px] p-5">
                  <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#d4a93e]">
                    Step {index + 1}
                  </p>
                  <p className="mt-4 text-base leading-7 text-[#d0dde0]">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">Protocol details</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Reference sections for operators, integrators, and reviewers.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {SPEC_SECTIONS.map((section) => (
              <article key={section.id} className="site-panel-muted rounded-[32px] p-8">
                <h3 className="text-[1.8rem] font-black tracking-[-0.03em] text-white">{section.title}</h3>
                <p className="site-copy mt-5">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <p className="site-label">Attack-vector mitigations</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                The spec defines control intent, not just happy-path behavior.
              </h2>
              <div className="mt-10 grid gap-4">
                {ATTACK_VECTORS.map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-base leading-7 text-[#d0dde0]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="site-label">Protocol constants</p>
              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-0 py-3 text-left font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">Constant</th>
                        <th className="px-0 py-3 text-left font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONSTANTS.map(([name, value]) => (
                        <tr key={name} className="border-t border-white/10">
                          <td className="px-0 py-4 font-mono text-sm text-[#f0d080]">{name}</td>
                          <td className="px-0 py-4 font-mono text-sm text-[#d0dde0]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Signer boundary reminder</p>
                  <p className="site-copy-sm mt-3">
                    No Ward class stores a wallet, no Ward method calls submit_and_wait, and build_unsigned_tx() is the transaction construction path that preserves ward_signed = False.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-28">
          <div className="site-panel rounded-[38px] p-8 md:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="site-label">Navigation flow</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Move from the protocol reference into review, sandbox, and integration.
              </h2>
              <p className="site-copy mt-6">
                The spec should feed directly into a conformance review, a live sandbox run, or an implementation surface. No dead ends, no broken buttons, and no ambiguity about the next institutional step.
              </p>
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
                Open Demo Workspace
              </Link>
              <Link
                href="/build"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
              >
                Build With Ward
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
