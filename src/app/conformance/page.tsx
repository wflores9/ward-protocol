import type { Metadata } from 'next';
import Link from 'next/link';

import { PILOT_URL } from '@/lib/navigation';
import { getPublishedPackageVersions } from '@/lib/packageVersions';
import { formatPackageVersion } from '@/lib/wardMetrics';
import { PILOT_READINESS_PHASES } from '@/lib/wardPlatform';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Ward Conformance | Institutional Default-Resolution Standard',
  description:
    'Ward Conformance defines the institutional standard for deterministic default resolution: nine on-ledger checks, unsigned settlement instructions, and a preserved signer boundary.',
  openGraph: {
    title: 'Ward Conformance',
    description:
      'Institutional conformance for tokenized credit: deterministic on-ledger validation and ward_signed = False - always.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Conformance',
    description: 'Nine on-ledger checks, signer-boundary proof, and institutional verification.',
  },
};

const LEDGER_CHECKS = [
  {
    step: '01',
    check: 'Policy artifact exists and matches Ward taxon rules',
    evidence: 'XLS-20 policy NFT exists and carries the expected Ward policy taxon.',
    whyItMatters: 'Prevents forged or misclassified policy references from entering the claim path.',
  },
  {
    step: '02',
    check: 'Coverage window is valid on ledger time',
    evidence: 'XRPL ledger close_time and matching premium payment remain inside policy terms.',
    whyItMatters: 'Removes server-clock discretion and proves coverage was active when the claim was filed.',
  },
  {
    step: '03',
    check: 'Vault binding is correct',
    evidence: 'Policy metadata vault reference matches the defaulted vault under review.',
    whyItMatters: 'Stops a valid policy from being redirected to an unrelated loss event.',
  },
  {
    step: '04',
    check: 'Default signal is confirmed from authoritative state',
    evidence: 'Ward re-reads LedgerEntry(index=loan_id) and confirms the LSF_LOAN_DEFAULT flag.',
    whyItMatters: 'Treats event streams as hints, not authority, and anchors the decision to final ledger state.',
  },
  {
    step: '05',
    check: 'Loss amount is real and bounded',
    evidence: 'Vault loss is greater than zero drops before any payout can be prepared.',
    whyItMatters: 'Prevents zero-loss or malformed claims from moving into settlement construction.',
  },
  {
    step: '06',
    check: 'Coverage pool remains solvent',
    evidence: 'Pool usable balance, net of XRPL reserve requirements, is sufficient for the claim.',
    whyItMatters: 'Confirms the pool can support the payout without violating reserve or balance constraints.',
  },
  {
    step: '07',
    check: 'Policy is still live',
    evidence: 'The policy NFT has not already been burned, settled, or invalidated.',
    whyItMatters: 'Provides replay protection and blocks duplicate or already-closed claims.',
  },
  {
    step: '08',
    check: 'Claimant ownership is proven on ledger',
    evidence: 'AccountNFTs(account=claimant) confirms the claimant still holds the policy NFT.',
    whyItMatters: 'Ensures the filing party is the party entitled to invoke the policy.',
  },
  {
    step: '09',
    check: 'Solvency and signer boundary both hold at settlement',
    evidence: 'Pool solvency thresholds and rate limits pass, and Ward returns unsigned settlement instructions only.',
    whyItMatters: 'Stops pool drainage and preserves the institutional requirement that Ward never signs.',
  },
] as const;

const CONFORMANCE_MEANING = [
  {
    title: 'Deterministic evidence standard',
    body: 'Ward Conformance means default resolution is driven by explicit on-ledger evidence gates every time, not by operator discretion, hidden policy logic, or off-chain judgment.',
  },
  {
    title: 'Preserved institutional boundary',
    body: 'A conformant integration keeps signing authority with the institution, vault operator, or designated counterparty. Ward validates, prepares, and reports, but does not sign or settle.',
  },
  {
    title: 'Reviewable by serious partners',
    body: 'The resulting conformance record is designed for engineering, risk, compliance, and capital review. It is a technical assurance surface, not a marketing promise.',
  },
] as const;

const HARDENING_HIGHLIGHTS = [
  {
    label: '18 audit findings resolved',
    body: 'The June 2026 Aikido SAST/SCA rescan surfaced 18 findings. All critical and high-severity issues were remediated in-sprint. Full report: wardprotocol.org/reports/Ward_Protocol_Security_Report_June2026.pdf',
  },
  {
    label: 'Fail-closed controls',
    body: 'Authentication, premium verification, and unsafe production defaults were hardened so invalid states fail closed instead of being quietly accepted.',
  },
  {
    label: 'Signer-boundary enforcement',
    body: 'ward_signed = False was enforced repo-wide so unsigned transaction construction replaced signing paths across the protocol surface.',
  },
  {
    label: 'Operational hardening',
    body: 'Redis-backed rate limiting, settlement locking, SSRF protections, validation tightening, and better rejection reporting reduced operational risk.',
  },
] as const;

const VERIFICATION_STEPS = [
  {
    step: '01',
    title: 'Review the standard',
    body: 'Compare the product workflow against the Ward specification and verify that the same nine on-ledger checks govern default resolution.',
  },
  {
    step: '02',
    title: 'Inspect the evidence path',
    body: 'Confirm that each claim outcome is tied back to authoritative ledger state, not server clocks, mutable dashboards, or discretionary approvals.',
  },
  {
    step: '03',
    title: 'Confirm the signer boundary',
    body: 'Check that settlement artifacts are unsigned when produced by Ward and that institutional wallets, not Ward, remain the signing authority.',
  },
  {
    step: '04',
    title: 'Validate the receipt',
    body: 'Review the conformance receipt or reproduce the same checks against your own node, RPC provider, or internal validation environment.',
  },
] as const;

export default async function ConformancePage() {
  const packageVersions = await getPublishedPackageVersions();

  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-start">
            <div className="max-w-3xl">
              <p className="site-label">Ward Conformance</p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
                A clean institutional standard for default-resolution integrity.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-[#5a7a99]">
                Ward Conformance is the institutional assurance layer for deterministic default resolution. It means a
                credit product resolves claims through explicit on-ledger checks, preserves the signer boundary, and
                produces a record partners can review without trusting Ward as a discretionary operator.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  '9 on-ledger checks',
                  'Unsigned settlement instructions',
                  'Reviewable conformance receipt',
                  'June 2026 hardening complete',
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border px-4 py-1.5 font-mono text-[12px] text-[#5a7a99]"
                    style={{ borderColor: 'rgba(167,197,229,0.5)', background: '#F9FAFC' }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/spec"
                  className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  Review Specification
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Inspect Demo Workflow
                </Link>
              </div>
            </div>

            {/* Core invariant card */}
            <div
              className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
              style={{ borderColor: '#E4E9F2' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                Core invariant
              </p>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-[#0f2439]">
                ward_signed = False — always.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.75] text-[#5a7a99]">
                Ward prepares deterministic validation results and unsigned settlement instructions. Institutions sign.
                The chain settles. Ward never holds private keys, never acts as custodian, and never becomes a
                transaction signatory.
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  ['No Ward custody', 'No wallet storage, no secret handling, and no delegation of signing authority to Ward.'],
                  ['No Ward signature', 'Unsigned packets are prepared for institutional review and execution by the responsible counterparty.'],
                  ['Clean institutional boundary', 'Teams can confirm exactly where Ward stops and institutional authority begins.'],
                ].map(([title, body]) => (
                  <article
                    key={title}
                    className="rounded-lg p-4"
                    style={{ background: '#F9FAFC', border: '1px solid #E4E9F2' }}
                  >
                    <h3 className="text-[14px] font-semibold text-[#0f2439]">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.65] text-[#5a7a99]">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What conformance means */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">What conformance means</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Conformance is a technical claim about process integrity.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              A Ward-conformant product is not being described as risk-free or approved by a regulator. It is being
              described as technically disciplined: the default path is deterministic, the evidence is on ledger, and
              the signing boundary remains with the institution.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {CONFORMANCE_MEANING.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                style={{ borderColor: '#E4E9F2' }}
              >
                <div className="mb-4 h-[3px] w-7 rounded-sm bg-[#b8973a]" />
                <h3 className="text-[18px] font-semibold leading-snug text-[#0f2439]">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-[1.75] text-[#5a7a99]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Nine checks table */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">On-ledger evidence gates</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              The nine checks every conformant default path must satisfy.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              These checks make the decision path inspectable. They are designed to show not just that a claim was
              accepted or rejected, but which ledger facts justified the outcome.
            </p>
          </div>
          <div
            className="mt-10 overflow-x-auto rounded-xl border bg-white shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
            style={{ borderColor: '#E4E9F2' }}
          >
            <table className="w-full min-w-[900px] border-collapse">
              <thead style={{ background: '#F9FAFC', borderBottom: '1px solid #E4E9F2' }}>
                <tr>
                  {['Step', 'Check', 'Ledger evidence', 'Why it matters'].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEDGER_CHECKS.map((item) => (
                  <tr key={item.step} className="align-top" style={{ borderTop: '1px solid #E4E9F2' }}>
                    <td className="px-5 py-4 font-mono text-[13px] font-bold text-[#b8973a]">{item.step}</td>
                    <td className="px-5 py-4 text-[14px] font-semibold leading-6 text-[#0f2439]">{item.check}</td>
                    <td className="px-5 py-4 text-[13px] leading-6 text-[#5a7a99]">{item.evidence}</td>
                    <td className="px-5 py-4 text-[13px] leading-6 text-[#5a7a99]">{item.whyItMatters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Hardening sprint */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="max-w-2xl">
              <p className="site-label">June 2026 security hardening sprint</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Security maturity was tightened before institutional outreach scaled.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                The June 2026 sprint focused on closing audit findings, removing unsafe assumptions, and hardening the
                protocol surface for institutional review. The result was {formatPackageVersion(packageVersions.display)}, a stricter implementation of the same
                conformance model.
              </p>
            </div>
            <div className="grid gap-4">
              {HARDENING_HIGHLIGHTS.map((item) => (
                <article
                  key={item.label}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                  style={{ borderColor: '#E4E9F2' }}
                >
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.75] text-[#5a7a99]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilot readiness */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Pilot readiness timetable</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Four visible phases from technical review to production certification.
            </h2>
          </div>
          <div className="mt-10 grid gap-4">
            {PILOT_READINESS_PHASES.slice(0, 4).map((phase) => (
              <article
                key={phase.phase}
                className="rounded-xl border p-6 md:grid md:grid-cols-[88px_1fr_160px] md:gap-6 md:p-7"
                style={{ borderColor: '#E4E9F2', background: '#F9FAFC' }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-lg font-mono text-[16px] font-bold text-white"
                  style={{ background: '#b8973a' }}
                >
                  {phase.phase}
                </div>
                <div className="mt-4 md:mt-0">
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0f2439]">{phase.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.75] text-[#5a7a99]">{phase.body}</p>
                </div>
                <div
                  className="mt-4 self-start rounded-md border px-4 py-2 font-mono text-[13px] font-bold text-[#b8973a] md:mt-0 md:text-center"
                  style={{ borderColor: 'rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.07)' }}
                >
                  {phase.window}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Verification for partners and institutions</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Conformance should be verifiable, not merely asserted.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {VERIFICATION_STEPS.map((item) => (
              <article
                key={item.step}
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
                style={{ borderColor: '#E4E9F2' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">{item.step}</p>
                <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-[#0f2439]">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.75] text-[#5a7a99]">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/spec"
              className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
            >
              Review Specification
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
              style={{ borderColor: 'rgba(15,36,57,0.18)' }}
            >
              Open Demo
            </Link>
            <a
              href={PILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-[#b8973a] px-6 py-3 text-[15px] font-semibold text-white transition hover:brightness-105"
            >
              Discuss a Pilot
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
