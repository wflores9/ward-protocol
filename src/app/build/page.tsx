import type { Metadata } from 'next';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import InstallBlocks from '@/components/InstallBlocks';
import { PILOT_URL } from '@/lib/navigation';
import { CHAIN_ADAPTERS, PILOT_READINESS_PHASES } from '@/lib/wardPlatform';

const ARCHITECTURE_MODULES = [
  ['Module 1', 'WardClient', 'High-level SDK entrypoint for institutions and integrators.'],
  ['Module 2', 'VaultMonitor', 'WebSocket default detection with authoritative ledger re-verification.'],
  ['Module 3', 'ClaimValidator', 'Nine-step deterministic on-chain claim validation.'],
  ['Module 4', 'EscrowSettlement', 'Unsigned escrow lifecycle for controlled institutional execution.'],
  ['Module 5', 'PoolHealthMonitor', 'Coverage ratio and reserve accounting for pool safety.'],
] as const;

const NINE_CHECKS = [
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

const KEY_CONSTANTS = [
  ['WARD_POLICY_TAXON', '281'],
  ['MIN_COVERAGE_RATIO', '1.5'],
  ['CLAIM_RATE_LIMIT_MAX', '3'],
  ['LSF_LOAN_DEFAULT', '0x00010000'],
  ['MONITOR_HEARTBEAT_TIMEOUT_S', '60'],
  ['XRPL_BASE_RESERVE_DROPS', '2_000_000'],
] as const;

export const metadata: Metadata = {
  title: 'Build With Ward | Tokenized Credit Conformance Infrastructure',
  description:
    'Integrate Ward Protocol into tokenized credit products with integration rails, SDKs, APIs, conformance receipts, and pilot readiness paths.',
  openGraph: {
    title: 'Build With Ward',
    description: 'Integrate the conformance and default-resolution layer for tokenized credit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build With Ward',
    description: 'SDKs, integration rails, conformance receipts, and pilot readiness for serious credit products.',
  },
};

export default function BuildPage() {
  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="site-label">Build</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
              Build a Ward-conformant product without giving up the signer boundary.
            </h1>
            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-[#5a7a99] md:text-[17px]">
              Ward provides the SDK surface, API path, and chain adapters needed to ship deterministic default resolution
              without giving Ward custody or signing authority.
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
                Review Protocol
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
        </div>
      </section>

      {/* Protocol spec — architecture */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Protocol specification</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Five modules. Nine checks. One conformance result.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
              The Ward conformance engine is deterministic and auditable. Every integration runs the same nine on-ledger
              checks through the same five modules, returning a machine-readable receipt institutions can inspect.
            </p>
            <Link
              href="/spec"
              className="mt-6 inline-flex items-center font-mono text-[13px] font-semibold text-[#2a5f9e] transition hover:text-[#0f2439]"
            >
              Read the full protocol specification →
            </Link>
          </div>

          {/* Architecture modules */}
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {ARCHITECTURE_MODULES.map(([step, title, body]) => (
              <article
                key={title}
                className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">{step}</p>
                <h3 className="mt-3 text-[15px] font-semibold text-[#0f2439]">{title}</h3>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#5a7a99]">{body}</p>
              </article>
            ))}
          </div>

          {/* Nine checks + Key constants */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Nine checks */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                Nine on-ledger checks
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NINE_CHECKS.map((check, i) => (
                  <div
                    key={check}
                    className="rounded-lg border p-4"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    <p className="font-mono text-[11px] font-bold text-[#b8973a]">Check {String(i + 1).padStart(2, '0')}</p>
                    <p className="mt-2 text-[12px] leading-[1.6] text-[#5a7a99]">{check}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key constants */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                Key constants
              </p>
              <div
                className="mt-4 rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <table className="w-full border-collapse">
                  <tbody>
                    {KEY_CONSTANTS.map(([name, value]) => (
                      <tr key={name} style={{ borderTop: '1px solid rgba(167,197,229,0.28)' }}>
                        <td className="py-2.5 font-mono text-[12px] text-[#b8973a]">{name}</td>
                        <td className="py-2.5 text-right font-mono text-[12px] text-[#5a7a99]">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  className="mt-5 rounded-lg p-3"
                  style={{ background: 'rgba(184,151,58,0.07)', borderLeft: '3px solid #b8973a' }}
                >
                  <p className="font-mono text-[11px] font-semibold text-[#b8973a]">ward_signed = False — always.</p>
                  <p className="mt-1 text-[12px] leading-[1.6] text-[#5a7a99]">
                    Ward returns unsigned payloads only. The institution signs. The chain settles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration surface */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="max-w-xl">
            <p className="site-label">Integration surface</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Start with the SDK. Finish with a conformance receipt.
            </h2>
          </div>
          <InstallBlocks />
        </div>
      </section>

      {/* Chain adapter catalog */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="max-w-xl">
              <p className="site-label">Chain adapter catalog</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Chain-native rails. One conformance result.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                Each rail maps the local chain primitive into Ward&apos;s conformance engine. Your product keeps its
                settlement rail. Ward standardizes the resolution path and the institutional review surface.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CHAIN_ADAPTERS.map((chain) => (
                <article
                  key={chain.id}
                  className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <ChainLogo id={chain.logo} label={`${chain.name} rail`} className="h-12 w-12" />
                    <span
                      className="rounded-md border px-3 py-1 font-mono text-[12px] text-[#5a7a99]"
                      style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
                    >
                      {chain.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-[#0f2439]">{chain.name}</h3>
                  <p className="mt-2 font-mono text-[12px] leading-5 text-[#a7c5e5]">{chain.integrationSurface}</p>
                  <p className="mt-3 text-[13px] leading-6 text-[#5a7a99]">{chain.proof}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pilot readiness timetable */}
      <section className="site-section">
        <div className="site-container py-20">
          <div
            className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-10 lg:p-12"
            style={{ borderColor: 'rgba(167,197,229,0.4)' }}
          >
            <div className="max-w-xl">
              <p className="site-label">Pilot readiness timetable</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Phase 1–4 from self-serve review to production certification.
              </h2>
            </div>

            <div className="mt-10 grid gap-4">
              {PILOT_READINESS_PHASES.slice(0, 4).map((phase) => (
                <article
                  key={phase.phase}
                  className="rounded-xl border p-6 md:grid md:grid-cols-[88px_1fr_160px] md:gap-6 md:p-7"
                  style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
