'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import WardMark from '@/components/WardMark';
import { PILOT_URL } from '@/lib/navigation';

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

const PROOF_STATS = [
  { num: '634', label: 'passing tests' },
  { num: '92%', label: 'critical path coverage' },
  { num: '8', label: 'chain adapters' },
  { num: '32', label: 'formal invariants' },
  { num: 'v0.2.6', label: 'PyPI + npm' },
];

type WardHealth = {
  status?: string;
  timestamp?: string;
  version?: string;
  tests_passing?: number | string;
  tests_total?: number | string;
  tests?: { passing?: number | string; total?: number | string };
  coverage?: number | string;
  last_validation?: string;
  lastValidation?: string;
  checks_passed?: number | string;
};

const HEALTH_URL = 'https://api.wardprotocol.org/health';
const HEALTH_PROXY_URL = '/api/ward-health';

const secondsAgo = (date: Date | null, now: number) => {
  if (!date) return '0s';
  return `${Math.max(0, Math.floor((now - date.getTime()) / 1000))}s`;
};

const formatVersion = (version?: string) => {
  if (!version) return 'v0.2.6';
  return version.startsWith('v') ? version : `v${version}`;
};

const apiStats = (health: WardHealth | null) => {
  const passing = health?.tests_passing ?? health?.tests?.passing ?? '634';
  const total = health?.tests_total ?? health?.tests?.total ?? '634';
  const coverage = health?.coverage ? `${health.coverage}`.replace(/%$/, '') + '%' : '92%';
  const validation =
    health?.last_validation ??
    health?.lastValidation ??
    (health?.checks_passed ? `checks_passed: ${health.checks_passed}` : health?.timestamp ?? 'checks_passed: 1');

  return [
    { label: 'Endpoint', value: 'api.wardprotocol.org', color: '#1d4ed8' },
    { label: 'Version', value: formatVersion(health?.version), color: '#0f2439' },
    { label: 'Tests passing', value: `${passing} / ${total}`, color: '#15803d' },
    { label: 'Coverage', value: coverage, color: '#15803d' },
    { label: 'Last validation', value: validation, color: '#15803d' },
  ];
};

export default function Home() {
  const [health, setHealth] = useState<WardHealth | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    const readHealth = async (url: string) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      return (await response.json()) as WardHealth;
    };

    const checkHealth = async () => {
      try {
        let data: WardHealth;
        try {
          data = await readHealth(HEALTH_URL);
        } catch {
          data = await readHealth(HEALTH_PROXY_URL);
        }
        if (cancelled) return;
        setHealth(data);
        setIsHealthy(data.status === 'healthy');
        setLastCheckedAt(new Date());
      } catch {
        if (cancelled) return;
        setIsHealthy(false);
        setLastCheckedAt(new Date());
      }
    };

    void checkHealth();
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(clock);
    };
  }, []);

  const stats = useMemo(() => apiStats(health), [health]);
  const checkedAgo = secondsAgo(lastCheckedAt, now);

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
                <span /> v0.2.6 · 8 chains · 634 tests · ward_signed = False
              </div>
            </div>

            <div className="fb-hero-product" aria-label="Ward API status preview">
              <div className="fb-product-orbit">
                <WardMark size={108} shape="square" />
              </div>
              <div className="fb-api-card">
                <div className="fb-api-card-head">
                  <span>Live API Status</span>
                  <strong className={isHealthy ? 'is-live' : 'is-offline'}>{isHealthy ? '● XRPL Altnet' : '● API OFFLINE'}</strong>
                </div>
                {stats.map(({ label, value, color }) => (
                  <div key={label} className="fb-api-row">
                    <span>{label}</span>
                    <strong style={{ color }}>{value}</strong>
                  </div>
                ))}
                <p className={isHealthy ? 'fb-api-updated is-live' : 'fb-api-updated is-offline'}>
                  {isHealthy ? 'Last updated' : 'Last checked'}: {checkedAgo} ago
                </p>
                <div className="fb-invariant-card">
                  <span>Core Invariant</span>
                  <strong>ward_signed = False — always.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fb-proof-strip">
        <div className="site-container">
          <div className="fb-proof-grid">
            {PROOF_STATS.map(({ num, label }) => (
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
