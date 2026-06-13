import type { Metadata } from 'next';
import Link from 'next/link';

import { PILOT_URL } from '@/lib/navigation';
import { WARD_MARKETING_STATS } from '@/lib/wardMetrics';

export const metadata: Metadata = {
  title: 'Ward Protocol Assurance | Formal Methods & High-Assurance Architecture',
  description:
    'Formal verification, property-based tests, TLA+ model checking, and signing-boundary static analysis. Ward Protocol invariants are machine-checked, not just claimed.',
  openGraph: {
    title: 'Ward Protocol Assurance',
    description: `Not a claim. A provable property. Formal methods, ${WARD_MARKETING_STATS.testsPassing} tests, ${WARD_MARKETING_STATS.coveragePercent}% coverage on critical paths.`,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol Assurance',
    description: 'TLA+ model checking, proptest invariants, Hypothesis property tests, and signing-boundary CI.',
  },
};

const FORMAL_ARTIFACTS = [
  {
    id: 'signing-boundary',
    file: 'scripts/check_signing_boundary.py',
    label: 'Signing boundary scanner',
    invariants: 'INV-003',
    body: 'Static analysis pass that rejects any code path calling submit_and_wait without an explicit ward-signing-permitted marker. Runs on every CI push.',
  },
  {
    id: 'hypothesis-tests',
    file: 'tests/test_invariants_property.py',
    label: 'Hypothesis property tests',
    invariants: 'INV-003, INV-005, INV-018, INV-019, INV-023',
    body: 'Property-based tests using Hypothesis. Arbitrary inputs generated across the full valid domain — no hand-written edge cases.',
  },
  {
    id: 'proptest',
    file: 'ward/tests/invariants_test.rs',
    label: 'Rust proptest invariants',
    invariants: 'INV-003, INV-017, INV-018',
    body: 'Proptest property tests against the Rust escrow crate. Verifies ward_signed=false, idempotency, and deterministic timing across all arbitrary inputs.',
  },
  {
    id: 'tla-spec',
    file: 'docs/formal/ward_validator.tla',
    label: 'TLA+ formal specification',
    invariants: 'INV-007, INV-016',
    body: 'TLA+ model of the nine-check conformance automaton and signing-boundary invariant. TLC model checker runs on every CI push.',
  },
  {
    id: 'invariants-md',
    file: 'INVARIANTS.md',
    label: 'Protocol invariants register',
    invariants: 'INV-001 – INV-032',
    body: '32 hard invariants covering signer boundary, ledger authority, nine-check conformance, settlement, routing, and API surface. Human-readable source of truth.',
  },
  {
    id: 'high-assurance-md',
    file: 'HIGH_ASSURANCE.md',
    label: 'High-assurance evidence log',
    invariants: 'All',
    body: 'Maps each invariant to its machine-checked evidence: test file, property test, static checker, or model check. Audit trail for conformance reviewers.',
  },
] as const;

const COVERAGE_MODULES = [
  { module: 'ward/settlement.py', coverage: 97, label: 'Settlement' },
  { module: 'ward/validator.py', coverage: 89, label: 'Validator' },
  { module: 'ward/primitives.py', coverage: 87, label: 'Primitives' },
] as const;

const NINE_CHECKS = [
  ['INV-008', 'Policy artifact exists', 'Policy NFT located by ID and taxon (WARD_POLICY_TAXON = 281).'],
  ['INV-009', 'Coverage window active', 'Policy expiry validated using XRPL ledger close_time — never server clock.'],
  ['INV-010', 'Vault binding matches', 'Metadata vault address must equal the defaulted vault. Cross-vault claims fail.'],
  ['INV-011', 'Default confirmed', 'LSF_LOAN_DEFAULT flag confirmed via authoritative LedgerEntry read.'],
  ['INV-012', 'Loss is real and bounded', 'Vault loss must be greater than zero drops. Validated, not asserted.'],
  ['INV-013', 'Coverage pool solvent', 'Pool usable balance must exceed loss amount. Reserve-adjusted.'],
  ['INV-014', 'Policy still live', 'Policy NFT must not be burned, closed, or already settled. Replay protection.'],
  ['INV-015', 'Claimant holds NFT', 'Claimant must still control the policy NFT at validation time, on ledger.'],
  ['INV-016', 'Signer boundary holds', 'Even after all nine checks pass — Ward returns unsigned instructions only.'],
] as const;

const AUDIT_ITEMS = [
  {
    label: 'TLC model check in CI',
    body: 'TLA+ SafetyInvariant checked on every push via java -cp tla2tools.jar tlc2.TLC. Not a one-time artifact.',
  },
  {
    label: 'Signing boundary enforced at lint time',
    body: 'scripts/check_signing_boundary.py fails the pipeline if any code calls submit_and_wait without an explicit exemption marker.',
  },
  {
    label: 'Coverage enforced on critical paths',
    body: 'validator.py 89%, settlement.py 97%, primitives.py 87%. Tracked per module in CI with --cov-report=term-missing.',
  },
  {
    label: 'Formal specification versioned in repo',
    body: 'ward_validator.tla and INVARIANTS.md are versioned alongside the implementation. Specification drift is a CI failure.',
  },
] as const;

export default function AssurancePage() {
  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
            style={{ borderColor: 'rgba(22,163,74,0.3)', background: 'rgba(22,163,74,0.06)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#16a34a]">
              Last scanned: June 11, 2026
            </span>
          </div>
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-4xl">
              <p className="site-label">High-Assurance Infrastructure</p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
                Not a claim. A provable property.
              </h1>
              <p className="mt-7 max-w-3xl text-[15px] leading-[1.75] text-[#5a7a99] md:text-[17px]">
                Ward Protocol invariants are machine-checked, not just documented. TLA+ model checking, property-based
                tests in Rust and Python, and signing-boundary static analysis run on every CI push.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  `${WARD_MARKETING_STATS.testsPassing} tests`,
                  `${WARD_MARKETING_STATS.coveragePercent}% coverage on critical paths`,
                  'TLA+ model checked',
                  'ward_signed = False — always',
                ].map((item) => (
                    <span
                      key={item}
                      className="rounded-md border px-4 py-2 font-mono text-[13px] text-[#5a7a99]"
                      style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#ffffff' }}
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
                  Review the Specification
                </Link>
                <a
                  href={PILOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Discuss a Pilot
                </a>
              </div>
            </div>

            <div
              className="rounded-xl border bg-white p-7 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-8"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <p
                className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]"
              >
                Assurance snapshot
              </p>
              <div className="mt-5 grid gap-4">
                {[
                  ['Core invariant', 'ward_signed = False — always'],
                  ['Formal verification', 'TLA+ SafetyInvariant, TLC checked in CI'],
                  ['Property tests', 'Hypothesis (Python) + proptest (Rust)'],
                  ['Static analysis', 'Signing boundary check on every push'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border p-5"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">{label}</p>
                    <p className="mt-2 text-[15px] font-semibold leading-6 text-[#0f2439]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core invariant */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-3xl">
            <p className="site-label">The invariant</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              One provable property anchors everything.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              Every formal artifact, every property test, and every static check traces back to this single structural
              guarantee. It is enforced in code, in CI, and in the TLA+ model simultaneously.
            </p>
          </div>

          <div
            className="mt-10 rounded-xl border bg-white p-7 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-8"
            style={{ borderColor: 'rgba(167,197,229,0.4)', borderLeft: '3px solid #b8973a' }}
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">
              INV-001 — INV-003 · Signer boundary
            </p>
            <pre className="mt-5 overflow-x-auto rounded-lg border p-5 font-mono text-[13px] leading-7 text-[#c8dce8]"
              style={{ background: '#1a2f3f', borderColor: 'rgba(167,197,229,0.12)' }}>
              {`ward_signed = False  -- always.

Ward may:   validate ledger state
            construct unsigned transaction payloads
            return deterministic conformance results
            produce receipts

Ward must not:  sign transactions
                store private keys
                request private keys
                become custodian
                become counterparty`}
            </pre>
            <p className="mt-5 font-mono text-[12px] text-[#5a7a99]">
              Enforced by: signing boundary scanner (CI) · TLA+ SafetyInvariant (TLC) · proptest INV-003 (Rust) · Hypothesis
              INV-003 (Python)
            </p>
          </div>
        </div>
      </section>

      {/* Formal artifacts */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-3xl">
            <p className="site-label">Formal methods artifacts</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Six machine-checked artifacts, all versioned in the repo.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              These are not documentation. They are executable evidence. Each one runs in CI and fails the pipeline if the
              invariant is violated.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {FORMAL_ARTIFACTS.map((artifact) => (
              <article
                key={artifact.id}
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">
                  {artifact.invariants}
                </p>
                <h3 className="mt-4 text-[17px] font-semibold leading-snug text-[#0f2439]">{artifact.label}</h3>
                <p className="mt-2 font-mono text-[11px] text-[#a7c5e5]">{artifact.file}</p>
                <p className="mt-4 text-[14px] leading-[1.75] text-[#5a7a99]">{artifact.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Test coverage */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="site-label">Test coverage</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                {WARD_MARKETING_STATS.testsPassing} tests. {WARD_MARKETING_STATS.coveragePercent}% coverage on critical paths.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Coverage is not the goal — correctness is. But coverage provides a lower bound on the evidence surface.
                These numbers are enforced in CI with per-module tracking.
              </p>

              <div className="mt-8 grid gap-4">
                {COVERAGE_MODULES.map(({ module, coverage, label }) => (
                  <div
                    key={module}
                    className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                    style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[15px] font-semibold text-[#0f2439]">{label}</p>
                        <p className="mt-1 font-mono text-[12px] text-[#a7c5e5]">{module}</p>
                      </div>
                      <span className="font-mono text-[22px] font-bold text-[#b8973a]">{coverage}%</span>
                    </div>
                    <div
                      className="mt-4 h-1.5 w-full rounded-full"
                      style={{ background: 'rgba(167,197,229,0.25)' }}
                    >
                      <div
                        className="h-1.5 rounded-full bg-[#b8973a]"
                        style={{ width: `${coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border bg-white p-7 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                Test suite breakdown
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Unit tests', 'test_ward.py', '449 tests'],
                  ['Property tests (Python)', 'tests/test_invariants_property.py', '61 tests'],
                  ['Coverage gap tests', 'tests/test_coverage_gaps.py', '40 tests'],
                  ['SDK tests', 'sdk/python/tests/', 'full SDK surface'],
                  ['Rust property tests', 'ward/tests/invariants_test.rs', '4 proptest suites'],
                  ['TypeScript tests', 'sdk/typescript/', 'full TS SDK'],
                ].map(([suite, path, count]) => (
                  <div
                    key={suite}
                    className="rounded-lg border p-4"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-[#0f2439]">{suite}</p>
                        <p className="mt-1 font-mono text-[11px] text-[#a7c5e5]">{path}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[12px] font-bold text-[#b8973a]">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nine-check invariants */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-3xl">
            <p className="site-label">Nine-check conformance</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Every check is an invariant, not a policy.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              INV-007 states that a claim cannot pass unless all nine checks pass. There is no override, no emergency
              bypass, and no partial conformance. INV-016 closes the boundary — Ward returns unsigned instructions only.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {NINE_CHECKS.map(([inv, title, body]) => (
              <article
                key={inv}
                className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">{inv}</p>
                <h3 className="mt-3 text-[15px] font-semibold text-[#0f2439]">{title}</h3>
                <p className="mt-3 text-[13px] leading-6 text-[#5a7a99]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Audit readiness */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="site-label">Audit readiness</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Machine-checked evidence before the auditors arrive.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Ward Protocol targets Q3 2026 for a formal third-party audit. The formal artifacts, property tests, and
                static checkers described here form the pre-audit evidence package. They run continuously — not on request.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/docs"
                  className="inline-flex items-center rounded-lg border px-5 py-2.5 text-[14px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Read the docs
                </Link>
                <Link
                  href="/spec"
                  className="inline-flex items-center rounded-lg border px-5 py-2.5 text-[14px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                  style={{ borderColor: 'rgba(15,36,57,0.18)' }}
                >
                  Full specification
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {AUDIT_ITEMS.map((item) => (
                <article
                  key={item.label}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                >
                  <h3 className="text-[15px] font-semibold text-[#0f2439]">{item.label}</h3>
                  <p className="mt-3 text-[14px] leading-[1.75] text-[#5a7a99]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Report */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="site-label">Security Report · June 2026</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Aikido Security rescan — 18 findings resolved.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                An automated SAST/SCA scan was completed June 11, 2026. All critical and high-severity findings were
                remediated in-sprint. The full report is available for download.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/reports/Ward_Protocol_Security_Report_June2026.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download Security Report PDF
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { value: String(WARD_MARKETING_STATS.testsPassing), label: 'Total tests passing', sub: 'Python · Rust · TypeScript' },
                { value: '18', label: 'SAST/SCA findings', sub: 'All resolved or accepted' },
                { value: '0', label: 'Open CVEs', sub: 'As of June 11, 2026' },
                { value: 'Clean', label: 'Git history', sub: 'Scrubbed June 11, 2026' },
              ].map(({ value, label, sub }) => (
                <div
                  key={label}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                >
                  <p className="font-mono text-[26px] font-bold leading-none text-[#b8973a]">{value}</p>
                  <p className="mt-2 text-[13px] font-semibold leading-snug text-[#0f2439]">{label}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#a7c5e5]">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="site-section">
        <div className="site-container py-20">
          <div
            className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-10 lg:p-12"
            style={{ borderColor: 'rgba(167,197,229,0.4)' }}
          >
            <div className="max-w-3xl">
              <p className="site-label">Next steps</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Review the specification. Discuss a pilot.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                The assurance evidence is public and versioned. The full technical specification, conformance review, and
                integration surface are available without a sales call.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/spec"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Review the Specification
              </Link>
              <a
                href={PILOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-[#b8973a] px-6 py-3 text-[15px] font-semibold text-white transition hover:brightness-105"
              >
                Discuss a Pilot
              </a>
              <Link
                href="/conformance"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Conformance Review
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
