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
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div className="max-w-3xl">
              <p className="site-label">Protocol specification</p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
                The technical basis for deterministic default resolution.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-[#5a7a99]">
                Engineering reference for Ward Protocol: architecture, claim validation, signer-boundary guarantees,
                settlement behavior, and the controls that make conformance reviewable.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {['9 on-ledger checks', '15 attack vectors mitigated', 'ward_signed = False', 'SDK v0.2.6'].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border px-4 py-1.5 font-mono text-[12px] text-[#5a7a99]"
                      style={{ borderColor: 'rgba(167,197,229,0.5)', background: '#f8fafc' }}
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  Open Demo
                </Link>
                <Link
                  href="/conformance"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Review Conformance
                </Link>
                <Link
                  href="/build"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Build With Ward
                </Link>
              </div>
            </div>

            {/* Spec snapshot card */}
            <div
              className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">
                Specification snapshot
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Core invariant', 'ward_signed = False'],
                  ['Decision source', 'Authoritative on-ledger state only'],
                  ['Settlement role', 'Ward returns unsigned payloads only'],
                  ['Primary assurance surface', 'Nine-step claim validation'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg p-4"
                    style={{ background: '#f8fafc', border: '1px solid rgba(167,197,229,0.35)' }}
                  >
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]">
                      {label}
                    </p>
                    <p className="mt-2 text-[14px] font-semibold text-[#0f2439]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Architecture</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Five modules form the conformance and settlement surface.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {ARCHITECTURE.map(([step, title, body]) => (
              <article
                key={title}
                className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">{step}</p>
                <h3 className="mt-3 text-[16px] font-semibold text-[#0f2439]">{title}</h3>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#5a7a99]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Claim validation */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="max-w-2xl">
              <p className="site-label">Claim validation</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Nine deterministic checks govern every claim.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                These steps are intentionally explicit. They define the evidence path institutions can inspect and the
                basis for every conformant result.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CLAIM_STEPS.map((step, index) => (
                <article
                  key={step}
                  className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.65] text-[#5a7a99]">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Protocol details */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Protocol details</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Reference sections for operators, integrators, and reviewers.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {SPEC_SECTIONS.map((section) => (
              <article
                key={section.id}
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0f2439]">{section.title}</h3>
                <p className="mt-4 text-[14px] leading-[1.75] text-[#5a7a99]">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Attack vectors + Constants */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <p className="site-label">Attack-vector mitigations</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                The spec defines control intent, not just happy-path behavior.
              </h2>
              <div className="mt-8 grid gap-3">
                {ATTACK_VECTORS.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border p-4 text-[14px] leading-[1.7] text-[#5a7a99]"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="site-label">Protocol constants</p>
              <div
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(167,197,229,0.4)' }}>
                        <th className="px-0 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]">
                          Constant
                        </th>
                        <th className="px-0 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONSTANTS.map(([name, value]) => (
                        <tr key={name} style={{ borderTop: '1px solid rgba(167,197,229,0.28)' }}>
                          <td className="px-0 py-3 font-mono text-[12px] text-[#b8973a]">{name}</td>
                          <td className="px-0 py-3 font-mono text-[12px] text-[#5a7a99]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  className="mt-6 rounded-lg p-4"
                  style={{ background: 'rgba(184,151,58,0.07)', borderLeft: '3px solid #b8973a' }}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                    Signer boundary reminder
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[#5a7a99]">
                    No Ward class stores a wallet, no Ward method calls submit_and_wait, and build_unsigned_tx() is the
                    transaction construction path that preserves ward_signed = False.
                  </p>
                </div>
              </div>
            </div>
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
              <p className="site-label">Navigation flow</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Move from the protocol reference into review, sandbox, and integration.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                The spec should feed directly into a conformance review, a live sandbox run, or an implementation
                surface. No dead ends, no broken buttons, and no ambiguity about the next institutional step.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/conformance"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Review Conformance
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Open Demo
              </Link>
              <Link
                href="/build"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
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
