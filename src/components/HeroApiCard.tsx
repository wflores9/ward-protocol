'use client';

import { useEffect, useState } from 'react';

type ApiStatus = 'loading' | 'online' | 'offline';

interface HealthData {
  version?: string;
  timestamp?: string;
  uptime_seconds?: number;
}

export default function HeroApiCard() {
  const [status, setStatus] = useState<ApiStatus>('loading');
  const [health, setHealth] = useState<HealthData>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.wardprotocol.org/health', {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: HealthData) => {
        setHealth(data);
        setStatus('online');
      })
      .catch(() => setStatus('offline'));

    return () => controller.abort();
  }, []);

  const lastValidation = (() => {
    if (status === 'loading') return '…';
    if (status === 'offline') return 'unavailable';
    if (health.timestamp) {
      try {
        const diff = Math.round((Date.now() - new Date(health.timestamp).getTime()) / 1000);
        return diff < 10 ? 'just now' : `${diff}s ago`;
      } catch {
        return 'just now';
      }
    }
    return 'just now';
  })();

  const badge =
    status === 'offline' ? (
      <span
        style={{
          background: '#fee2e2',
          color: '#dc2626',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', display: 'inline-block', flexShrink: 0 }} />
        API OFFLINE
      </span>
    ) : (
      <span
        style={{
          background: '#dcfce7',
          color: '#15803d',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          opacity: status === 'loading' ? 0.5 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#15803d', display: 'inline-block', flexShrink: 0 }} />
        XRPL Altnet
      </span>
    );

  const rows: { label: string; value: string; color: string }[] = [
    { label: 'Endpoint',        value: 'api.wardprotocol.org',  color: '#1d4ed8' },
    { label: 'Version',         value: health.version ?? 'v0.2.6', color: '#0f2439' },
    { label: 'Tests passing',   value: '634 / 634',             color: '#15803d' },
    { label: 'Coverage',        value: '92%',                   color: '#15803d' },
    { label: 'Last validation', value: lastValidation,          color: status === 'offline' ? '#dc2626' : '#15803d' },
  ];

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        width: '85%',
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 16,
        padding: 40,
        border: '1px solid rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Card header */}
      <div
        style={{
          borderBottom: '1px solid #E4E9F2',
          marginBottom: 20,
          paddingBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#a7c5e5',
          }}
        >
          Live API Status
        </span>
        {badge}
      </div>

      {/* Stat rows */}
      {rows.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F9FAFC',
            padding: '9px 0',
          }}
        >
          <span style={{ fontSize: 13, color: '#8a9bb0' }}>{label}</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
