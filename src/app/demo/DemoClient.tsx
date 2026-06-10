'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import ChainSelector from '@/components/ChainSelector';
import { CHAIN_ADAPTERS, CONFORMANCE_CHECKS, type ChainAdapter } from '@/lib/wardPlatform';

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

const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  {
    id: 1,
    label: 'NFT found — premium rejected',
    description: 'Policy NFT located on ledger. Step 2 fails: premium payment not confirmed.',
  },
  {
    id: 2,
    label: 'Policy NFT not found',
    description: 'Invalid NFT ID supplied. Step 1 fails: policy artifact not located.',
  },
  {
    id: 3,
    label: 'Vault binding mismatch',
    description: 'Wrong vault address supplied. Step 3 fails: vault binding not confirmed.',
  },
];

const makeSessionId = () => `WARD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

function buildReceipt(
  chain: ChainAdapter,
  sessionId: string,
  scenario: ScenarioId,
  apiResult: ApiResult | null,
  runState: RunState,
): string {
  if (runState === 'idle') {
    return 'receipt_id:    —\n\nRun validation to generate receipt.';
  }

  const scenarioLabels: Record<ScenarioId, string> = {
    1: 'SCENARIO_1 · NFT found / premium rejected',
    2: 'SCENARIO_2 · Policy NFT not found',
    3: 'SCENARIO_3 · Vault binding mismatch',
  };

  const checksPassCount = apiResult
    ? apiResult.checks_passed
    : scenario === 2
      ? 0
      : scenario === 3
        ? 2
        : 1;

  const lines = [
    `receipt_id:    ${sessionId}`,
    `chain:         ${chain.name}`,
    `network:       ${chain.network}`,
    `scenario:      ${scenarioLabels[scenario]}`,
    `result:        ${apiResult?.approved ? 'WARD_CONFORMANT' : 'WARD_REJECTED'}`,
    `checks_passed: ${checksPassCount}/9`,
    `ward_signed:   false`,
    `settlement:    unsigned packet returned to institution`,
    `source:        ${apiResult?.source ?? 'simulation'}`,
  ];

  if (apiResult?.rejection_reason) {
    lines.push(`rejection:     ${apiResult.rejection_reason}`);
  }
  if (apiResult?.rejection_memo_hex) {
    lines.push(`memo_hex:      ${apiResult.rejection_memo_hex}`);
  }

  return lines.join('\n');
}

export default function DemoClient() {
  const [selectedChain, setSelectedChain] = useState<ChainAdapter>(CHAIN_ADAPTERS[0]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [activeScenario, setActiveScenario] = useState<ScenarioId>(1);
  const [checkStatuses, setCheckStatuses] = useState<Record<string, CheckStatus>>({});
  const [receiptCopied, setReceiptCopied] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [statusText, setStatusText] = useState('Select a scenario and run validation.');

  const receipt = buildReceipt(selectedChain, sessionId, activeScenario, apiResult, runState);
  const isXrpl = selectedChain.id === 'xrpl';

  useEffect(() => {
    setRunState('idle');
    setSessionId(makeSessionId());
    setActiveScenario(1);
    setCheckStatuses({});
    setReceiptCopied(false);
    setApiResult(null);
    setStatusText('Select a scenario and run validation.');
  }, [selectedChain.id]);

  function selectScenario(id: ScenarioId) {
    if (runState === 'running') return;
    setActiveScenario(id);
    setRunState('idle');
    setSessionId(makeSessionId());
    setCheckStatuses({});
    setReceiptCopied(false);
    setApiResult(null);
    setStatusText(SCENARIOS.find((s) => s.id === id)?.description ?? '');
  }

  const runValidation = async () => {
    if (runState === 'running') return;

    const sid = makeSessionId();
    setRunState('running');
    setCheckStatuses({});
    setReceiptCopied(false);
    setApiResult(null);
    setSessionId(sid);
    setStatusText('Connecting to Ward API…');

    const nftId = activeScenario === 2 ? FAKE_NFT_ID : DEMO_NFT_ID;
    const vault = activeScenario === 3 ? DEMO_POOL : DEMO_VAULT;

    let apiAvailable = false;
    if (DEMO_KEY) {
      try {
        const healthResp = await fetch(`${WARD_API}/health`, { signal: AbortSignal.timeout(5000) });
        apiAvailable = healthResp.ok;
      } catch {
        apiAvailable = false;
      }
    }

    if (!apiAvailable) setStatusText('API unavailable — running simulation');

    let realResult: ApiResult | null = null;

    if (apiAvailable && DEMO_KEY) {
      setStatusText('Ward API connected — reading XRPL Altnet ledger…');
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
      } catch {
        setStatusText('API call failed — running simulation');
      }
    }

    let checksPassCount: number;
    let failCheckId: string | null;

    if (realResult) {
      checksPassCount = realResult.checks_passed;
      failCheckId = checksPassCount < 9 ? (CONFORMANCE_CHECKS[checksPassCount]?.id ?? null) : null;
    } else {
      if (activeScenario === 2) { checksPassCount = 0; failCheckId = '01'; }
      else if (activeScenario === 3) { checksPassCount = 2; failCheckId = '03'; }
      else { checksPassCount = 1; failCheckId = '02'; }
    }

    for (let i = 0; i < CONFORMANCE_CHECKS.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      const check = CONFORMANCE_CHECKS[i];
      if (i < checksPassCount) {
        setCheckStatuses((prev) => ({ ...prev, [check.id]: 'pass' }));
      } else if (check.id === failCheckId) {
        setCheckStatuses((prev) => ({ ...prev, [check.id]: 'fail' }));
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    if (realResult) setApiResult(realResult);
    setRunState('done');

    const checksDisplay = realResult ? `${realResult.checks_passed}/9` : `${checksPassCount}/9`;
    const resultLabel = (realResult ? realResult.approved : false) ? 'WARD_CONFORMANT' : 'WARD_REJECTED';
    setStatusText(`${sid} — ${checksDisplay} checks — ${resultLabel}`);
  };

  const copyReceipt = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(receipt);
    setReceiptCopied(true);
  };

  const passCount = Object.values(checkStatuses).filter((s) => s === 'pass').length;

  return (
    <main className="site-shell">
      {/* Hero + Chain Selector */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-20 pt-24 lg:pt-28">
          <p className="site-label">Ward conformance workspace</p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
            Run deterministic conformance on any supported chain.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-[#5a7a99]">
            XRPL Altnet runs against the live Ward API. All other chains show the adapter surface and testnet deployment.
          </p>
          <div className="mt-10">
            <ChainSelector chains={CHAIN_ADAPTERS} selected={selectedChain} onSelect={setSelectedChain} />
          </div>
        </div>
      </section>

      {/* XRPL Live Sandbox */}
      {isXrpl && (
        <section className="site-section">
          <div className="site-container py-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="badge-live">LIVE — XRPL Altnet</span>
              <span className="font-mono text-[13px] text-[#a7c5e5]">api.wardprotocol.org · XLS-66 lending vaults</span>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {/* Left: Demo Vault */}
              <div
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Demo Vault</p>
                <div className="mt-5 space-y-5">
                  {[
                    { label: 'Vault', value: DEMO_VAULT, href: `${XRPL_EXPLORER}/accounts/${DEMO_VAULT}` },
                    { label: 'Pool', value: DEMO_POOL, href: `${XRPL_EXPLORER}/accounts/${DEMO_POOL}` },
                    { label: 'Claimant', value: DEMO_CLAIMANT, href: `${XRPL_EXPLORER}/accounts/${DEMO_CLAIMANT}` },
                    {
                      label: 'Policy NFT',
                      value: `${DEMO_NFT_ID.slice(0, 16)}…`,
                      href: `${XRPL_EXPLORER}/nfts/${DEMO_NFT_ID}`,
                    },
                  ].map(({ label, value, href }) => (
                    <div key={label}>
                      <p className="font-mono text-[11px] text-[#a7c5e5]">{label}</p>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all font-mono text-[13px] text-[#2a5f9e] underline decoration-[#2a5f9e]/30 underline-offset-4 hover:decoration-[#2a5f9e]"
                      >
                        {value}
                      </a>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-5 border-t pt-5"
                  style={{ borderColor: 'rgba(167,197,229,0.28)' }}
                >
                  <p className="font-mono text-[11px] text-[#a7c5e5]">Loan ID</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-[#5a7a99]">{DEMO_LOAN_ID}</p>
                </div>
              </div>

              {/* Center: Scenarios + Run */}
              <div
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Run Validation</p>
                <div className="mt-5 space-y-3">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectScenario(s.id)}
                      disabled={runState === 'running'}
                      className="w-full rounded-lg border p-4 text-left transition disabled:cursor-not-allowed"
                      style={{
                        borderColor:
                          activeScenario === s.id ? '#b8973a' : 'rgba(167,197,229,0.35)',
                        background:
                          activeScenario === s.id ? 'rgba(184,151,58,0.07)' : '#f8fafc',
                      }}
                    >
                      <p
                        className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: activeScenario === s.id ? '#b8973a' : '#a7c5e5' }}
                      >
                        Scenario {s.id}
                      </p>
                      <p className="mt-1 text-[14px] font-semibold text-[#0f2439]">{s.label}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={runValidation}
                  disabled={runState === 'running'}
                  className="mt-5 w-full rounded-lg bg-[#0f2439] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runState === 'running' ? 'Running…' : 'Run Ward Validation'}
                </button>
                <p
                  className="mt-4 rounded-lg border p-3 font-mono text-[12px] leading-5 text-[#5a7a99]"
                  style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                >
                  {statusText}
                </p>
              </div>

              {/* Right: 9-Check Results */}
              <div
                className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                    9-Check Results
                  </p>
                  <span
                    className="rounded-md border px-3 py-1 font-mono text-[12px] text-[#5a7a99]"
                    style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
                  >
                    {apiResult ? `${apiResult.checks_passed}/9` : `${passCount}/9`}
                  </span>
                </div>
                <div className="space-y-2">
                  {CONFORMANCE_CHECKS.map((check) => {
                    const status: CheckStatus = checkStatuses[check.id] ?? 'pending';
                    return (
                      <div
                        key={check.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                        style={{
                          borderColor: 'rgba(167,197,229,0.3)',
                          background:
                            status === 'pass'
                              ? 'rgba(22,163,74,0.06)'
                              : status === 'fail'
                                ? 'rgba(220,38,38,0.06)'
                                : '#f8fafc',
                        }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold"
                          style={{
                            background:
                              status === 'pass'
                                ? '#16a34a'
                                : status === 'fail'
                                  ? '#dc2626'
                                  : 'rgba(167,197,229,0.3)',
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
              </div>
            </div>

            {/* Ward Receipt */}
            <div
              className="mt-6 rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-8"
              style={{ borderColor: 'rgba(167,197,229,0.4)' }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">
                  Ward Conformance Receipt
                </p>
                {runState === 'done' && (
                  <a
                    href={`${XRPL_EXPLORER}/nfts/${DEMO_NFT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] text-[#2a5f9e] hover:underline"
                  >
                    View NFT on Altnet →
                  </a>
                )}
              </div>
              <pre
                className="whitespace-pre-wrap break-words rounded-lg border p-5 font-mono text-[13px] leading-7 text-[#0f2439]"
                style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
              >
                {receipt}
              </pre>
              {apiResult?.rejection_memo_hex && (
                <p className="mt-3 font-mono text-[12px] text-[#5a7a99]">
                  memo_hex is an on-chain memo written to the XRPL Altnet ledger at rejection time.
                </p>
              )}
              <button
                onClick={copyReceipt}
                disabled={runState !== 'done'}
                className="mt-5 w-full rounded-lg bg-[#0f2439] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {receiptCopied ? 'Receipt Copied' : 'Copy Receipt'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Non-XRPL adapter card */}
      {!isXrpl && (
        <section className="site-section">
          <div className="site-container py-20">
            <div className="mx-auto max-w-2xl">
              <div
                className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.08)] md:p-10"
                style={{ borderColor: 'rgba(167,197,229,0.4)' }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span
                      className="rounded-md border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]"
                      style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
                    >
                      Adapter in development
                    </span>
                    <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-[#0f2439]">
                      {selectedChain.name}
                    </h2>
                    <p className="mt-2 font-mono text-[13px] text-[#5a7a99]">{selectedChain.network}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-md border px-3 py-1.5 font-mono text-[13px] font-bold text-[#b8973a]"
                    style={{ borderColor: 'rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.08)' }}
                  >
                    {selectedChain.status}
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Deployed contract', value: selectedChain.deploymentRef },
                    { label: 'Policy artifact', value: selectedChain.policyArtifact },
                    { label: 'Integration surface', value: selectedChain.integrationSurface },
                    { label: 'Full adapter', value: 'Phase 2 — Q3 2026', highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className="rounded-lg border p-5"
                      style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
                    >
                      <p className="font-mono text-[11px] text-[#a7c5e5]">{label}</p>
                      <p
                        className="mt-2 break-all font-mono text-[13px]"
                        style={{ color: highlight ? '#b8973a' : '#0f2439' }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {selectedChain.walletActions.slice(1).map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-mono text-[13px] text-[#5a7a99] transition hover:border-[rgba(167,197,229,0.6)] hover:text-[#0f2439]"
                      style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f8fafc' }}
                    >
                      {action.label} →
                    </a>
                  ))}
                  <Link
                    href="/build"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0f2439] px-5 py-2.5 font-mono text-[13px] font-semibold text-white transition hover:bg-[#0d1f32]"
                  >
                    View integration path →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
