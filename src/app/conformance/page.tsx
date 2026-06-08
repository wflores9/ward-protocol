import type { Metadata } from 'next';
import Link from 'next/link';

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
    title: 'A deterministic evidence standard',
    body: 'Ward Conformance means default resolution is driven by explicit on-ledger evidence gates every time, not by operator discretion, hidden policy logic, or off-chain judgment.',
  },
  {
    title: 'A preserved institutional boundary',
    body: 'A conformant integration keeps signing authority with the institution, vault operator, or designated counterparty. Ward validates, prepares, and reports, but does not sign or settle.',
  },
  {
    title: 'A reviewable record for serious partners',
    body: 'The resulting conformance record is designed for engineering, risk, compliance, and capital review. It is a technical assurance surface, not a marketing promise.',
  },
] as const;

const HARDENING_HIGHLIGHTS = [
  {
    label: '107 fixes delivered',
    body: 'The June 2026 sprint closed audit findings and tightened the production surface ahead of institutional outreach.',
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

export default function ConformancePage() {
  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-20 md:px-10 lg:px-12 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="site-label">Ward Conformance</p>
              <h1 className="mt-5 text-5xl font-black leading-[1.03] tracking-[-0.03em] text-white md:text-6xl">
                A technical standard serious institutions can inspect.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#d0dde0] md:text-xl">
                Ward Conformance is the institutional assurance layer for deterministic default resolution. It means a credit product resolves claims through explicit on-ledger checks, preserves the signer boundary, and produces a record partners can review without trusting Ward as a discretionary operator.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#d0dde0]">
                {[
                  '9 on-ledger checks',
                  'Unsigned settlement instructions',
                  'Reviewable conformance receipt',
                  'June 2026 hardening completed',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/spec"
                  className="inline-flex min-h-12 items-center rounded-full bg-[#f7f9f7] px-6 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
                >
                  Read the specification
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Inspect the demo workflow
                </Link>
              </div>
            </div>

            <div className="site-panel rounded-[32px] p-6 md:p-8">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Core invariant</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">ward_signed = False - always.</h2>
              <p className="mt-4 text-base leading-7 text-[#d0dde0]">
                Ward prepares deterministic validation results and unsigned settlement instructions. Institutions sign. The chain settles. Ward never holds private keys, never acts as custodian, and never becomes a transaction signatory.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  ['No Ward custody', 'No wallet storage, no secret handling, and no delegation of signing authority to Ward.'],
                  ['No Ward signature', 'Unsigned packets are prepared for institutional review and execution by the responsible counterparty.'],
                  ['Clean institutional boundary', 'Teams can confirm exactly where Ward stops and institutional authority begins.'],
                ].map(([title, body]) => (
                  <article key={title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#d0dde0]">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="site-label">What conformance means</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              Conformance is a technical claim about process integrity.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
              A Ward-conformant product is not being described as risk-free, underwritten by Ward, or approved by a regulator. It is being described as technically disciplined: the default path is deterministic, the evidence is on ledger, and the signing boundary remains with the institution.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {CONFORMANCE_MEANING.map((item) => (
              <article key={item.title} className="site-panel-muted rounded-[28px] p-6">
                <h3 className="text-2xl font-black text-white">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#d0dde0]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="site-label">On-ledger evidence gates</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              The nine checks every conformant default path must satisfy.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
              These checks make the decision path inspectable. They are designed to show not just that a claim was accepted or rejected, but which ledger facts justified the outcome.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-[28px] border border-white/10 bg-white/[0.03]">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="bg-white/[0.03]">
                <tr>
                  {['Step', 'Check', 'Ledger evidence', 'Why it matters'].map((header) => (
                    <th key={header} className="px-5 py-4 text-left font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#9eb0b7]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEDGER_CHECKS.map((item) => (
                  <tr key={item.step} className="border-t border-white/10 align-top">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-[#d4a93e]">{item.step}</td>
                    <td className="px-5 py-4 text-base font-bold text-white">{item.check}</td>
                    <td className="px-5 py-4 text-base leading-7 text-[#d0dde0]">{item.evidence}</td>
                    <td className="px-5 py-4 text-base leading-7 text-[#d0dde0]">{item.whyItMatters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-12">
          <div>
            <p className="site-label">June 2026 security hardening sprint</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              Security maturity was tightened before institutional outreach scaled.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
              The June 2026 sprint focused on closing audit findings, removing unsafe assumptions, and hardening the protocol surface for institutional review. The result was v0.2.6, a stricter implementation of the same conformance model.
            </p>
            <p className="mt-5 text-base leading-7 text-[#9eb0b7]">
              The assurance story now combines protocol design, visible controls, and a clearer institutional-readiness narrative.
            </p>
          </div>

          <div className="grid gap-4">
            {HARDENING_HIGHLIGHTS.map((item) => (
              <article key={item.label} className="site-panel-muted rounded-[24px] p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">{item.label}</p>
                <p className="mt-3 text-base leading-7 text-[#d0dde0]">{item.body}</p>
              </article>
            ))}
            <article className="site-panel rounded-[24px] p-5">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Assurance baseline</p>
              <p className="mt-3 text-base leading-7 text-[#d0dde0]">
                For serious partners, conformance is not just a statement about product behavior. It is also a statement that the implementation has been hardened to keep the signer boundary and evidence path credible under review.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="site-label">Verification for partners and institutions</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              Conformance should be verifiable, not merely asserted.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#d0dde0]">
              Serious counterparties should be able to inspect the standard, review a conformance record, and confirm the signer boundary without relying on private process or informal assurances.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {VERIFICATION_STEPS.map((item) => (
              <article key={item.step} className="site-panel-muted rounded-[24px] p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">{item.step}</p>
                <h3 className="mt-4 text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#d0dde0]">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/spec"
              className="inline-flex min-h-12 items-center rounded-full bg-[#f7f9f7] px-6 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
            >
              Review technical spec
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
            >
              Inspect demo workflow
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
