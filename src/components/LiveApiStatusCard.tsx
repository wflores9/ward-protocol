'use client';

import { useEffect, useMemo, useState } from 'react';

import WardMark from '@/components/WardMark';

type WardHealth = {
  status?: string;
  timestamp?: string;
  version?: string;
  xrpl_url?: string;
  network?: string;
  tests_passing?: number | string;
  tests_total?: number | string;
  tests?: { passing?: number | string; total?: number | string };
  coverage?: number | string;
  last_validation?: string;
  lastValidation?: string;
  ward_client_available?: boolean;
  ward_signed?: boolean;
  invariant?: string;
};

const HEALTH_URL = 'https://api.wardprotocol.org/health';
const HEALTH_PROXY_URL = '/api/ward-health';

const FALLBACK = {
  status: 'offline',
  version: 'unavailable',
  network: 'XRPL Altnet',
  invariant: 'ward_signed = False — always',
} satisfies WardHealth;

const secondsAgo = (date: Date | null, now: number) => {
  if (!date) return '0s';
  return `${Math.max(0, Math.floor((now - date.getTime()) / 1000))}s`;
};

const formatVersion = (version?: string) => {
  if (!version || version === 'unavailable') return 'Unavailable';
  return version.startsWith('v') ? version : `v${version}`;
};

const formatNetwork = (health: WardHealth | null) => {
  const explicit = health?.network;
  if (explicit) return explicit;
  if (health?.xrpl_url?.toLowerCase().includes('altnet')) return 'XRPL Altnet';
  return FALLBACK.network;
};

const formatTests = (health: WardHealth | null) => {
  const passing = health?.tests_passing ?? health?.tests?.passing;
  const total = health?.tests_total ?? health?.tests?.total;
  if (!passing && !total) return 'Not reported';
  return `${passing ?? total} / ${total ?? passing}`;
};

const formatCoverage = (health: WardHealth | null) => {
  if (health?.coverage === undefined || health.coverage === null) return 'Not reported';
  return `${health.coverage}`.replace(/%$/, '') + '%';
};

const formatLastValidation = (health: WardHealth | null) =>
  health?.last_validation ?? health?.lastValidation ?? 'Not reported';

export default function LiveApiStatusCard() {
  const [health, setHealth] = useState<WardHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      } catch {
        if (cancelled) return;
        setHealth(FALLBACK);
        setIsHealthy(false);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setLastCheckedAt(new Date());
        }
      }
    };

    void checkHealth();
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(clock);
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Endpoint', value: 'api.wardprotocol.org', color: '#1d4ed8' },
      { label: 'Network', value: formatNetwork(health), color: '#15803d' },
      { label: 'Version', value: formatVersion(health?.version), color: '#0f2439' },
      { label: 'Tests passing', value: formatTests(health), color: '#5a7a99' },
      { label: 'Coverage', value: formatCoverage(health), color: '#5a7a99' },
      { label: 'Last validation', value: formatLastValidation(health), color: '#5a7a99' },
    ],
    [health],
  );
  const checkedAgo = secondsAgo(lastCheckedAt, now);
  const badge = isLoading ? '● CHECKING' : isHealthy ? '● XRPL Altnet' : '● API OFFLINE';

  return (
    <div className="fb-hero-product" aria-label="Ward API status preview">
      <div className="fb-product-orbit">
        <WardMark size={108} shape="square" />
      </div>
      <div className="fb-api-card">
        <div className="fb-api-card-head">
          <span>Live API Status</span>
          <strong className={isHealthy ? 'is-live' : 'is-offline'}>{badge}</strong>
        </div>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="fb-api-row">
            <span>{label}</span>
            <strong style={{ color }}>{isLoading ? 'Loading...' : value}</strong>
          </div>
        ))}
        <p className={isHealthy ? 'fb-api-updated is-live' : 'fb-api-updated is-offline'}>
          {isHealthy ? 'Last updated' : 'Last checked'}: {checkedAgo} ago
        </p>
        <div className="fb-invariant-card">
          <span>Core Invariant</span>
          <strong>{health?.invariant ?? FALLBACK.invariant}.</strong>
        </div>
      </div>
    </div>
  );
}
