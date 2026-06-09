import type { Metadata } from 'next';
import Link from 'next/link';

import { PILOT_URL } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Ward Protocol Assurance | Formal Methods & High-Assurance Architecture',
  description:
    'Formal verification, property-based tests, TLA+ model checking, and signing-boundary static analysis. Ward Protocol invariants are machine-checked, not just claimed.',
  openGraph: {
    title: 'Ward Protocol Assurance',
    description: 'Not a claim. A provable property. Formal methods, 537 tests, 92% coverage on critical paths.',
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
    invariants: 'INV-001 – INV-026',
    body: '26 hard invariants covering signer boundary, ledger authority, nine-check conformance, settlement, routing, and API surface. Human-readable source of truth.',
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
    <main className="site-shell text-[#f7f9f7]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container pb-28 pt-24 lg:pt-32">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-4xl">
              <p className="site-label">High-Assurance Infrastructure</p>
              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5rem]">
                Not a claim. A provable property.
              </h1>
              <p className="site-copy mt-8 max-w-3xl text-lg md:text-[1.2rem]">
                Ward Protocol invariants are machine-checked, not just documented. TLA+ model checking, property-based tests
                in Rust and Python, and signing-boundary static analysis run on every CI push. This page is the audit trail.
              </p>

              <div className="mt-9 flex flex-wrap gap-3 text-sm text-[#d0dde0]">
                {['537 tests', '92% coverage on critical paths', 'TLA+ model checked', 'ward_signed = False — always'].map(
                  (item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono">
                      {item}
                    </span>
                  ),
                )}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/spec"
                  className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
                >
                  Review the Specification
                </Link>
                <a
                  href={PILOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center rounded-full border border-[#d4a93e]/30 bg-[#d4a93e]/10 px-7 py-3 text-base font-bold text-[#d4a93e] transition hover:bg-[#d4a93e]/20"
                >
                  Discuss a Pilot
                </a>
              </div>
            </div>

            <div className="site-panel rounded-[38px] p-8 md:p-10">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Assurance snapshot</p>
              <div className="mt-6 grid gap-4">
                {[
                  ['Core invariant', 'ward_signed = False — always'],
                  ['Formal verification', 'TLA+ SafetyInvariant, TLC checked in CI'],
                  ['Property tests', 'Hypothesis (Python) + proptest (Rust)'],
                  ['Static analysis', 'Signing boundary check on every push'],
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

      {/* Core invariant */}
      <section className="site-section">
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">The invariant</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              One provable property anchors everything.
            </h2>
            <p className="site-copy mt-6">
              Every formal artifact, every property test, and every static check traces back to this single structural
              guarantee. It is enforced in code, in CI, and in the TLA+ model simultaneously.
            </p>
          </div>

          <div className="mt-12 site-panel rounded-[34px] p-8 md:p-10">
            <p className="font-mono text-sm font-bold text-[#d4a93e]">INV-001 — INV-003 · Signer boundary</p>
            <pre className="mt-6 overflow-x-auto rounded-[20px] border border-white/10 bg-[#07131a] p-6 font-mono text-sm leading-7 text-[#f0d080]">
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
            <p className="mt-6 font-mono text-sm text-[#9eb0b7]">
              Enforced by: signing boundary scanner (CI) · TLA+ SafetyInvariant (TLC) · proptest INV-003 (Rust) · Hypothesis
              INV-003 (Python)
            </p>
          </div>
        </div>
      </section>

      {/* Formal artifacts */}
      <section className="site-section">
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">Formal methods artifacts</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Six machine-checked artifacts, all versioned in the repo.
            </h2>
            <p className="site-copy mt-6">
              These are not documentation. They are executable evidence. Each one runs in CI and fails the pipeline if the
              invariant is violated.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {FORMAL_ARTIFACTS.map((artifact) => (
              <article key={artifact.id} className="site-panel-muted rounded-[30px] p-6">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#d4a93e]">
                  {artifact.invariants}
                </p>
                <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-white">{artifact.label}</h3>
                <p className="mt-2 font-mono text-xs text-[#9eb0b7]">{artifact.file}</p>
                <p className="site-copy-sm mt-4">{artifact.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Test coverage */}
      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="site-label">Test coverage</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                537 tests. 92% coverage on critical paths.
              </h2>
              <p className="site-copy mt-6">
                Coverage is not the goal — correctness is. But coverage provides a lower bound on the evidence surface. These
                numbers are enforced in CI with per-module tracking.
              </p>

              <div className="mt-10 grid gap-4">
                {COVERAGE_MODULES.map(({ module, coverage, label }) => (
                  <div key={module} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-white">{label}</p>
                        <p className="mt-1 font-mono text-xs text-[#9eb0b7]">{module}</p>
                      </div>
                      <span className="font-mono text-2xl font-black text-[#d4a93e]">{coverage}%</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-[#d4a93e]"
                        style={{ width: `${coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="site-panel rounded-[34px] p-8">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Test suite breakdown</p>
              <div className="mt-6 grid gap-4">
                {[
                  ['Unit tests', 'test_ward.py', '496 tests'],
                  ['Property tests (Python)', 'tests/test_invariants_property.py', '61 tests'],
                  ['Coverage gap tests', 'tests/test_coverage_gaps.py', '40 tests'],
                  ['SDK tests', 'sdk/python/tests/', 'full SDK surface'],
                  ['Rust property tests', 'ward/tests/invariants_test.rs', '4 proptest suites'],
                  ['TypeScript tests', 'sdk/typescript/', 'full TS SDK'],
                ].map(([suite, path, count]) => (
                  <div key={suite} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#f7f9f7]">{suite}</p>
                        <p className="mt-1 font-mono text-xs text-[#9eb0b7]">{path}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-[#d4a93e]">{count}</span>
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
        <div className="site-container py-28">
          <div className="max-w-3xl">
            <p className="site-label">Nine-check conformance</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Every check is an invariant, not a policy.
            </h2>
            <p className="site-copy mt-6">
              INV-007 states that a claim cannot pass unless all nine checks pass. There is no override, no emergency bypass,
              and no partial conformance. INV-016 closes the boundary — Ward returns unsigned instructions only, even after
              all nine checks succeed.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {NINE_CHECKS.map(([inv, title, body]) => (
              <article key={inv} className="site-panel rounded-[28px] p-5">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#d4a93e]">{inv}</p>
                <h3 className="mt-3 text-base font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#9eb0b7]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Audit readiness */}
      <section className="site-section">
        <div className="site-container py-28">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="site-label">Audit readiness</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Machine-checked evidence before the auditors arrive.
              </h2>
              <p className="site-copy mt-6">
                Ward Protocol targets Q3 2026 for a formal third-party audit. The formal artifacts, property tests, and
                static checkers described here form the pre-audit evidence package. They run continuously — not on request.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/docs"
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 font-semibold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Read the docs
                </Link>
                <Link
                  href="/spec"
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 font-semibold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                >
                  Full specification
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {AUDIT_ITEMS.map((item) => (
                <article key={item.label} className="site-panel-muted rounded-[28px] p-5">
                  <h3 className="text-base font-black text-white">{item.label}</h3>
                  <p className="site-copy-sm mt-3">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="site-section">
        <div className="site-container py-28">
          <div className="site-panel rounded-[38px] p-8 md:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="site-label">Next steps</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                Review the specification. Discuss a pilot.
              </h2>
              <p className="site-copy mt-6">
                The assurance evidence is public and versioned. The full technical specification, conformance review, and
                integration surface are available without a sales call. When you are ready to discuss a pilot, the path is
                direct.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/spec"
                className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
              >
                Review the Specification
              </Link>
              <a
                href={PILOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center rounded-full border border-[#d4a93e]/30 bg-[#d4a93e] px-7 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105"
              >
                Discuss a Pilot
              </a>
              <Link
                href="/conformance"
                className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
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
