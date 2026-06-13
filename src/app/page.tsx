import Link from 'next/link';

import LiveApiStatusCard from '@/components/LiveApiStatusCard';
import { PILOT_URL } from '@/lib/navigation';
import { getPublishedPackageVersions } from '@/lib/packageVersions';
import { formatPackageVersion, WARD_MARKETING_STATS, wardMarketingStatusLine } from '@/lib/wardMetrics';

export const revalidate = 3600;

const pillars = [
  {
    title: 'Deterministic evidence model',
    body: 'Ward re-reads authoritative ledger state and applies the same resolution logic every time. Inspectable and repeatable under institutional review.',
  },
  {
    title: 'Signer boundary preserved',
    body: 'Ward validates and returns unsigned settlement instructions. Institutions sign. The chain settles. Ward never holds keys and never becomes a signatory.',
  },
  {
    title: 'Designed for scrutiny',
    body: 'Evidence gates, control boundaries, and on-ledger checks are packaged so engineering, risk, and compliance teams can review the same record.',
  },
];

export default async function Home() {
  const packageVersions = await getPublishedPackageVersions();
  const proofStats = [
    { num: String(WARD_MARKETING_STATS.testsPassing), label: 'passing tests' },
    { num: `${WARD_MARKETING_STATS.coveragePercent}%`, label: 'critical path coverage' },
    { num: String(WARD_MARKETING_STATS.chainAdapters), label: 'chain adapters' },
    { num: String(WARD_MARKETING_STATS.formalInvariants), label: 'formal invariants' },
    { num: formatPackageVersion(packageVersions.display), label: 'PyPI + npm' },
  ];

  return (
    <main className="fb-page">
      <section className="fb-hero">
        <div className="site-container">
          <div className="fb-hero-layout">
            <div className="fb-hero-copy">
              <p className="fb-eyebrow">Institutional tokenized credit · conformance standard</p>
              <h1>Default resolution infrastructure for tokenized credit.</h1>
              <p className="fb-lede">
                Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults,
                preserve the signer boundary, and export reviewable conformance receipts.
              </p>
              <div className="fb-actions">
                <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="fb-button fb-button-primary">
                  Discuss a pilot
                </a>
                <Link href="/spec" className="fb-button fb-button-secondary">
                  View the protocol
                </Link>
              </div>
              <div className="fb-version-badge">
                <span /> {wardMarketingStatusLine(packageVersions.display)}
              </div>
            </div>

            <LiveApiStatusCard />
          </div>
        </div>
      </section>

      <section className="fb-proof-strip">
        <div className="site-container">
          <div className="fb-proof-grid">
            {proofStats.map(({ num, label }) => (
              <div key={label} className="fb-proof-item">
                <p>{num}</p>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fb-section">
        <div className="site-container">
          <div className="fb-section-head">
            <p className="site-label">The standard</p>
            <h2>Tokenized credit needs a default process that holds up under scrutiny.</h2>
          </div>

          <div className="fb-pillar-grid">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="fb-pillar-card">
                <div />
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fb-section fb-section-soft">
        <div className="site-container">
          <div className="fb-invariant-panel">
            <p className="site-label">Core invariant</p>
            <h2>ward_signed = False — always.</h2>
            <p>
              Ward prepares deterministic validation and unsigned settlement instructions. Institutions sign. The chain
              settles. Ward is never a counterparty, never a custodian, and never a signatory.
            </p>
          </div>
        </div>
      </section>

      <section className="fb-section">
        <div className="site-container">
          <div className="fb-cta-panel">
            <div>
              <p className="site-label">Pilots open now</p>
              <h2>Ward Protocol is pre-mainnet. Pilots open now.</h2>
              <p>Run the conformance demo, inspect the evidence surface, and book a pilot call when you are ready.</p>
            </div>
            <div className="fb-actions">
              <Link href="/demo" className="fb-button fb-button-primary">Enter the Demo</Link>
              <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="fb-button fb-button-secondary">
                Discuss a Pilot
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
