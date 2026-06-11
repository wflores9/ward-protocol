'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { CHAIN_ADAPTERS, type ChainAdapter } from '@/lib/wardPlatform';

const WARD_API = 'https://api.wardprotocol.org';
const DEMO_KEY = process.env.NEXT_PUBLIC_WARD_DEMO_KEY ?? '';
const DEMO_VAULT = process.env.NEXT_PUBLIC_DEMO_VAULT ?? 'rGvYtf6y2tX2CdtU7V5xAzNBRhrGLbYpzk';
const DEMO_POOL = process.env.NEXT_PUBLIC_DEMO_POOL ?? 'rJqWPzks9e8UJPnidMDM1Yq9TvFz1YZEcx';
const DEMO_CLAIMANT = process.env.NEXT_PUBLIC_DEMO_CLAIMANT ?? 'rEwDmirKJVRJydcMKQJYws5hX7ehbKFm4x';
const DEMO_NFT_ID =
  process.env.NEXT_PUBLIC_DEMO_NFT_ID ?? '000100009B502ACA514FDD2143BF6AC25C2C0956D91E74F75C9AFDA401143122';
const DEMO_LOAN_ID = 'F355E3D66C7335F56AB0D3C8B657AAB5B05608C877E254F5748614255710AD11';
const FAKE_NFT_ID = '0000000000000000000000000000000000000000000000000000000000000000';
const XRPL_EXPLORER = 'https://testnet.xrpl.org';

type RunState = 'idle' | 'running' | 'done';
type RunMode = 'unknown' | 'live' | 'simulated';
type ScenarioId = 1 | 2 | 3;
type CheckStatus = 'pending' | 'pass' | 'fail';

type ApiResult = {
  checks_passed: number;
  approved: boolean;
  rejection_reason: string;
  rejection_memo_hex?: string;
  ward_signed: boolean;
  source: string;
};

const SCENARIOS: { id: ScenarioId; label: string; description: string; passCount: number; failAt: string }[] = [
  {
    id: 1,
    label: 'Valid default',
    description: 'NFT exists, vault matches, claimant registered. Premium payment check fails at step 7.',
    passCount: 6,
    failAt: '07',
  },
  {
    id: 2,
    label: 'Missing NFT',
    description: 'NFT not found on-chain. Policy located check fails at step 5.',
    passCount: 4,
    failAt: '05',
  },
  {
    id: 3,
    label: 'Wrong vault',
    description: 'NFT exists but vault address mismatch. Vault address check fails at step 2.',
    passCount: 1,
    failAt: '02',
  },
];

const DEMO_CHECKS = [
  { id: '01', label: 'Institution registered' },
  { id: '02', label: 'Vault address verified' },
  { id: '03', label: 'Pool address verified' },
  { id: '04', label: 'Claimant address verified' },
  { id: '05', label: 'NFT policy located' },
  { id: '06', label: 'NFT not revoked' },
  { id: '07', label: 'Premium payment verified' },
  { id: '08', label: 'Default conditions met' },
  { id: '09', label: 'Settlement instructions valid' },
];

const XRPL_VAULT_ADDRESSES = [
  { label: 'Vault', value: DEMO_VAULT, href: `${XRPL_EXPLORER}/accounts/${DEMO_VAULT}` },
  { label: 'Pool', value: DEMO_POOL, href: `${XRPL_EXPLORER}/accounts/${DEMO_POOL}` },
  { label: 'Claimant', value: DEMO_CLAIMANT, href: `${XRPL_EXPLORER}/accounts/${DEMO_CLAIMANT}` },
  {
    label: 'NFT ID',
    value: `${DEMO_NFT_ID.slice(0, 14)}…`,
    href: `${XRPL_EXPLORER}/nfts/${DEMO_NFT_ID}`,
  },
];

const makeSessionId = () => `WARD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
const maskedKey = DEMO_KEY ? `ward_demo_2026_${DEMO_KEY.slice(-4).padStart(4, '*')}` : 'ward_demo_2026_****';

function buildReceipt(
  chain: ChainAdapter,
  sessionId: string,
  scenario: ScenarioId,
  apiResult: ApiResult | null,
  checkStatuses: Record<string, CheckStatus>,
  runState: RunState,
): string {
  if (runState === 'idle') return 'receipt_id:    —\n\nRun validation to generate receipt.';
  const passCount = Object.values(checkStatuses).filter((s) => s === 'pass').length;
  const lines = [
    `receipt_id:    ${sessionId}`,
    `chain:         ${chain.name}`,
    `network:       ${chain.network}`,
    `scenario:      SCENARIO_${scenario}`,
    `result:        ${apiResult?.approved ? 'WARD_CONFORMANT' : 'WARD_REJECTED'}`,
    `checks_passed: ${apiResult ? `${apiResult.checks_passed}/9` : `${passCount}/9`}`,
    `ward_signed:   false`,
    `settlement:    unsigned packet returned to institution`,
    `source:        ${apiResult?.source ?? 'simulation'}`,
  ];
  if (apiResult?.rejection_reason) lines.push(`rejection:     ${apiResult.rejection_reason}`);
  if (apiResult?.rejection_memo_hex) lines.push(`memo_hex:      ${apiResult.rejection_memo_hex}`);
  return lines.join('\n');
}

export default function DemoClient() {
  const [selectedChain, setSelectedChain] = useState<ChainAdapter>(CHAIN_ADAPTERS[0]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [runMode, setRunMode] = useState<RunMode>('unknown');
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [activeScenario, setActiveScenario] = useState<ScenarioId>(1);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('Select a scenario and run validation.');
  const [receiptCopied, setReceiptCopied] = useState(false);

  const isXrpl = selectedChain.id === 'xrpl';
  const receipt = buildReceipt(selectedChain, sessionId, activeScenario, apiResult, checkStatuses, runState);
  const passCount = Object.values(checkStatuses).filter((s) => s === 'pass').length;

  useEffect(() => {
    setRunState('idle');
    setRunMode('unknown');
    setSessionId(makeSessionId());
    setActiveScenario(1);
    setCheckStatuses({});
    setApiResult(null);
    setReceiptCopied(false);
    setStatusMsg('Select a scenario and run validation.');
  }, [selectedChain.id]);

  function selectScenario(id: ScenarioId) {
    if (runState === 'running') return;
    setActiveScenario(id);
    setRunState('idle');
    setRunMode('unknown');
    setSessionId(makeSessionId());
    setCheckStatuses({});
    setApiResult(null);
    setReceiptCopied(false);
    setStatusMsg(SCENARIOS.find((s) => s.id === id)?.description ?? '');
  }

  const runValidation = async () => {
    if (runState === 'running') return;
    const sid = makeSessionId();
    setRunState('running');
    setCheckStatuses({});
    setApiResult(null);
    setReceiptCopied(false);
    setSessionId(sid);
    setStatusMsg('Connecting to Ward API…');

    const scenario = SCENARIOS.find((s) => s.id === activeScenario)!;
    const nftId = activeScenario === 2 ? FAKE_NFT_ID : DEMO_NFT_ID;
    const vault = activeScenario === 3 ? DEMO_POOL : DEMO_VAULT;

    let apiAvailable = false;
    if (isXrpl && DEMO_KEY) {
      try {
        const h = await fetch(`${WARD_API}/health`, { signal: AbortSignal.timeout(5000) });
        apiAvailable = h.ok;
      } catch { apiAvailable = false; }
    }

    let realResult: ApiResult | null = null;
    if (apiAvailable && DEMO_KEY && isXrpl) {
      setRunMode('live');
      setStatusMsg('Ward API connected — reading XRPL Altnet ledger…');
      try {
        const resp = await fetch(`${WARD_API}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Institution-Key': DEMO_KEY },
          body: JSON.stringify({
            vault_id: vault,
            policy_nft_id: nftId,
            claimant_address: DEMO_CLAIMANT,
            loan_id: DEMO_LOAN_ID,
            pool_address: DEMO_POOL,
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await resp.json();
        realResult = {
          checks_passed: typeof data.checks_passed === 'number' ? data.checks_passed : 0,
          approved: data.approved === true,
          rejection_reason: data.rejection_reason ?? '',
          rejection_memo_hex: data.rejection_memo_hex,
          ward_signed: false,
          source: 'api.wardprotocol.org · XRPL Altnet',
        };
      } catch { setStatusMsg('API call failed — running simulation'); }
    } else if (!apiAvailable) {
      setRunMode('simulated');
      setStatusMsg('API unavailable — running simulation');
    } else {
      setRunMode('simulated');
    }

    // Determine how many checks pass and where it fails
    let checksPassCount: number;
    let failCheckId: string | null;

    if (realResult) {
      checksPassCount = realResult.checks_passed;
      failCheckId = checksPassCount < 9 ? (DEMO_CHECKS[checksPassCount]?.id ?? null) : null;
    } else {
      checksPassCount = scenario.passCount;
      failCheckId = scenario.failAt;
    }

    // Animate
    for (let i = 0; i < DEMO_CHECKS.length; i++) {
      await new Promise((r) => setTimeout(r, 160));
      const check = DEMO_CHECKS[i];
      if (i < checksPassCount) {
        setCheckStatuses((prev) => ({ ...prev, [check.id]: 'pass' }));
      } else if (check.id === failCheckId) {
        setCheckStatuses((prev) => ({ ...prev, [check.id]: 'fail' }));
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 280));
    if (realResult) setApiResult(realResult);
    setRunState('done');
    const total = realResult ? `${realResult.checks_passed}/9` : `${checksPassCount}/9`;
    setStatusMsg(`${sid} — ${total} checks — ${(realResult ? realResult.approved : false) ? 'WARD_CONFORMANT' : 'WARD_REJECTED'}`);
  };

  const copyReceipt = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(receipt);
    setReceiptCopied(true);
  };

  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-14 pt-24 lg:pt-28">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="site-label">Ward Institutional Sandbox</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[46px]">
                Live conformance validation.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.75] text-[#5a7a99]">
                Select a chain. Choose a scenario. Run Ward&apos;s nine-check engine against the live API. XRPL Altnet
                is live. Solana is in active development. All other chains are roadmap — environments provisioned, adapters scoped.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
              <span className="badge-live">XRPL Altnet</span>
              <span className="font-mono text-[12px] text-[#a7c5e5]">api.wardprotocol.org</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-column workspace */}
      <section className="site-section">
        <div className="site-container py-10">
          <div className="grid gap-5 lg:grid-cols-[240px_1fr_260px]">
            {/* LEFT: Chain selector + vault addresses */}
            <div
              className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                Select Chain
              </p>
              <div className="mt-4 space-y-2">
                {CHAIN_ADAPTERS.map((chain) => {
                  const isSelected = selectedChain.id === chain.id;
                  const isLive = chain.id === 'xrpl';
                  return (
                    <button
                      key={chain.id}
                      onClick={() => setSelectedChain(chain)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition"
                      style={{
                        borderColor: isSelected ? '#0f2439' : 'rgba(167,197,229,0.35)',
                        background: isSelected ? 'rgba(15,36,57,0.05)' : '#f8fafc',
                      }}
                    >
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: isSelected ? '#0f2439' : '#5a7a99' }}
                      >
                        {chain.name}
                      </span>
                      {isLive ? (
                        <span className="badge-live" style={{ fontSize: 9, padding: '2px 7px' }}>
                          LIVE
                        </span>
                      ) : (
                        <span
                          className="rounded font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
                          style={{
                            color: '#a7c5e5',
                            background: 'rgba(167,197,229,0.12)',
                            padding: '2px 6px',
                          }}
                        >
                          Dev Q3 2026
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* XRPL vault addresses */}
              {isXrpl && (
                <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(167,197,229,0.28)' }}>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                    Demo Vault
                  </p>
                  <div className="mt-3 space-y-3">
                    {XRPL_VAULT_ADDRESSES.map(({ label, value, href }) => (
                      <div key={label}>
                        <p className="font-mono text-[10px] text-[#a7c5e5]">{label}</p>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block break-all font-mono text-[11px] text-[#2a5f9e] underline decoration-[#2a5f9e]/30 underline-offset-3 hover:decoration-[#2a5f9e]"
                        >
                          {value}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER: Scenarios + Run + API info */}
            <div
              className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                Validation
              </p>

              {isXrpl ? (
                <>
                  <div className="mt-4 space-y-2">
                    {SCENARIOS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectScenario(s.id)}
                        disabled={runState === 'running'}
                        className="w-full rounded-lg border p-4 text-left transition disabled:cursor-not-allowed"
                        style={{
                          borderColor: activeScenario === s.id ? '#b8973a' : 'rgba(167,197,229,0.35)',
                          background: activeScenario === s.id ? 'rgba(184,151,58,0.07)' : '#f8fafc',
                        }}
                      >
                        <p
                          className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: activeScenario === s.id ? '#b8973a' : '#a7c5e5' }}
                        >
                          Scenario {s.id}
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[#0f2439]">{s.label}</p>
                        <p className="mt-0.5 text-[12px] leading-5 text-[#5a7a99]">{s.description}</p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={runValidation}
                    disabled={runState === 'running'}
                    className="mt-5 w-full rounded-lg bg-[#0f2439] px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runState === 'running' ? 'Running…' : 'Run Ward Validation'}
                  </button>

                  {/* Live / Simulated mode pill */}
                  {runMode !== 'unknown' && (
                    <div className="mt-3 flex justify-center">
                      {runMode === 'live' ? (
                        <span
                          className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            background: 'rgba(22,163,74,0.1)',
                            color: '#15803d',
                            border: '1px solid rgba(22,163,74,0.3)',
                            borderRadius: 9999,
                            padding: '4px 14px',
                          }}
                        >
                          ● LIVE
                        </span>
                      ) : (
                        <span
                          className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
                          style={{
                            background: 'rgba(90,122,153,0.1)',
                            color: '#5a7a99',
                            border: '1px solid rgba(90,122,153,0.2)',
                            borderRadius: 9999,
                            padding: '4px 14px',
                          }}
                        >
                          ○ SIMULATED
                        </span>
                      )}
                    </div>
                  )}

                  {/* API info */}
                  <div
                    className="mt-5 space-y-2 rounded-lg border p-4"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#a7c5e5]">API endpoint</span>
                      <span className="font-mono text-[11px] font-bold text-[#2a5f9e]">api.wardprotocol.org</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#a7c5e5]">Demo key</span>
                      <span className="font-mono text-[11px] font-bold text-[#0f2439]">{maskedKey}</span>
                    </div>
                  </div>

                  <p
                    className="mt-3 rounded-lg border p-3 font-mono text-[11px] leading-5 text-[#5a7a99]"
                    style={{ borderColor: 'rgba(167,197,229,0.3)', background: '#f8fafc' }}
                  >
                    {statusMsg}
                  </p>
                </>
              ) : (
                /* Non-XRPL: adapter card */
                <div className="mt-5">
                  <div
                    className="rounded-lg border p-5"
                    style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                  >
                    <span
                      className="rounded font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        color: '#a7c5e5',
                        background: 'rgba(167,197,229,0.15)',
                        padding: '2px 8px',
                      }}
                    >
                      Adapter in development
                    </span>
                    <h3 className="mt-4 text-[20px] font-semibold text-[#0f2439]">{selectedChain.name}</h3>
                    <p className="mt-1 font-mono text-[12px] text-[#5a7a99]">{selectedChain.network}</p>
                    <div className="mt-5 space-y-3">
                      {[
                        { l: 'Deployed contract', v: selectedChain.deploymentRef },
                        { l: 'Policy artifact', v: selectedChain.policyArtifact },
                        { l: 'Integration surface', v: selectedChain.integrationSurface },
                        { l: 'Full adapter', v: 'Phase 2 — Q3 2026' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <p className="font-mono text-[10px] text-[#a7c5e5]">{l}</p>
                          <p className="mt-0.5 break-all font-mono text-[12px] text-[#0f2439]">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {selectedChain.walletActions.slice(1).map((action) => (
                      <a
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-4 py-2 font-mono text-[12px] text-[#5a7a99] transition hover:text-[#0f2439]"
                        style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f8fafc' }}
                      >
                        {action.label} →
                      </a>
                    ))}
                    <Link
                      href="/build"
                      className="rounded-lg bg-[#0f2439] px-4 py-2 font-mono text-[12px] font-semibold text-white transition hover:bg-[#0d1f32]"
                    >
                      View integration →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: 9 Checks + ward_signed badge */}
            <div
              className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                  Live Results
                </p>
                <span
                  className="rounded-md border px-2.5 py-1 font-mono text-[11px] text-[#5a7a99]"
                  style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
                >
                  {apiResult ? `${apiResult.checks_passed}/9` : `${passCount}/9`}
                </span>
              </div>

              <div className="space-y-1.5">
                {DEMO_CHECKS.map((check) => {
                  const status: CheckStatus = checkStatuses[check.id] ?? 'pending';
                  return (
                    <div
                      key={check.id}
                      className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
                      style={{
                        borderColor: 'rgba(167,197,229,0.28)',
                        background:
                          status === 'pass'
                            ? 'rgba(22,163,74,0.06)'
                            : status === 'fail'
                              ? 'rgba(220,38,38,0.06)'
                              : '#f8fafc',
                      }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold"
                        style={{
                          background:
                            status === 'pass'
                              ? '#16a34a'
                              : status === 'fail'
                                ? '#dc2626'
                                : 'rgba(167,197,229,0.28)',
                          color: status === 'pending' ? '#5a7a99' : '#ffffff',
                        }}
                      >
                        {status === 'pass' ? '✓' : status === 'fail' ? '✗' : check.id}
                      </span>
                      <span className="text-[12px] leading-5 text-[#5a7a99]">{check.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* ward_signed = False badge — always visible */}
              <div
                className="mt-5 rounded-lg"
                style={{
                  background: '#f8fafc',
                  borderLeft: '3px solid #b8973a',
                  padding: '10px 12px',
                }}
              >
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#b8973a]">
                  Core Invariant
                </p>
                <p className="mt-1 font-mono text-[12px] font-bold text-[#0f2439]">
                  ward_signed = False — always.
                </p>
              </div>
            </div>
          </div>

          {/* Receipt — below 3-col, only when done */}
          {runState === 'done' && (
            <div
              className="mt-5 rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                  Ward Conformance Receipt
                </p>
                {isXrpl && (
                  <a
                    href={`${XRPL_EXPLORER}/accounts/${DEMO_VAULT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] text-[#2a5f9e] hover:underline"
                  >
                    View vault on Altnet →
                  </a>
                )}
              </div>
              <pre
                className="mt-4 whitespace-pre-wrap break-words rounded-lg border p-4 font-mono text-[12px] leading-6 text-[#0f2439]"
                style={{ borderColor: 'rgba(167,197,229,0.3)', background: '#f8fafc' }}
              >
                {receipt}
              </pre>
              {apiResult?.rejection_memo_hex && (
                <p className="mt-2 font-mono text-[11px] text-[#5a7a99]">
                  memo_hex: on-chain memo written to Altnet ledger at rejection time.
                </p>
              )}
              <button
                onClick={copyReceipt}
                className="mt-4 w-full rounded-lg bg-[#0f2439] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                {receiptCopied ? 'Receipt Copied' : 'Copy Receipt'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
