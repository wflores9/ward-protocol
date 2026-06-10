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

  const approved = apiResult ? apiResult.approved : false;

  const lines = [
    `receipt_id:    ${sessionId}`,
    `chain:         ${chain.name}`,
    `network:       ${chain.network}`,
    `scenario:      ${scenarioLabels[scenario]}`,
    `result:        ${approved ? 'WARD_CONFORMANT' : 'WARD_REJECTED'}`,
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
    // scenario 3: swap vault with pool to trigger vault binding failure
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

    if (!apiAvailable) {
      setStatusText('API unavailable — running simulation');
    }

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

    // Determine pass/fail boundary
    let checksPassCount: number;
    let failCheckId: string | null;

    if (realResult) {
      checksPassCount = realResult.checks_passed;
      failCheckId = checksPassCount < 9 ? (CONFORMANCE_CHECKS[checksPassCount]?.id ?? null) : null;
    } else {
      // Simulation defaults per scenario
      if (activeScenario === 2) {
        checksPassCount = 0;
        failCheckId = '01';
      } else if (activeScenario === 3) {
        checksPassCount = 2;
        failCheckId = '03';
      } else {
        checksPassCount = 1;
        failCheckId = '02';
      }
    }

    // Animate check results
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
    <main className="site-shell text-[#f7f9f7]">
      {/* Hero + Chain Selector */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-40" />
        <div className="site-container pb-20 pt-24 lg:pt-32">
          <p className="site-label">Ward conformance workspace</p>
          <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
            Run deterministic conformance on any supported chain.
          </h1>
          <p className="site-copy mt-6 max-w-xl text-lg">
            XRPL Altnet runs against the live Ward API. All other chains show the adapter surface and testnet
            deployment.
          </p>
          <div className="mt-10">
            <ChainSelector chains={CHAIN_ADAPTERS} selected={selectedChain} onSelect={setSelectedChain} />
          </div>
        </div>
      </section>

      {/* XRPL Live Sandbox */}
      {isXrpl && (
        <section className="site-section">
          <div className="site-container py-24">
            <div className="mb-6 flex items-center gap-3">
              <span className="badge-live">LIVE — XRPL Altnet</span>
              <span className="font-mono text-sm text-[#a7c5e5]">api.wardprotocol.org · XLS-66 lending vaults</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: Demo Vault */}
              <div className="site-panel rounded-[30px] p-6">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Demo Vault</p>
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
                      <p className="font-mono text-xs text-[#a7c5e5]">{label}</p>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all font-mono text-sm text-[#9fc6ff] underline decoration-[#9fc6ff]/30 underline-offset-4 hover:decoration-[#9fc6ff]"
                      >
                        {value}
                      </a>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="font-mono text-xs text-[#a7c5e5]">Loan ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#c8dce8]">{DEMO_LOAN_ID}</p>
                </div>
              </div>

              {/* Center: Scenarios + Run */}
              <div className="site-panel rounded-[30px] p-6">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Run Validation</p>
                <div className="mt-5 space-y-3">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectScenario(s.id)}
                      disabled={runState === 'running'}
                      className="w-full rounded-[16px] border p-4 text-left transition disabled:cursor-not-allowed"
                      style={{
                        borderColor:
                          activeScenario === s.id ? 'rgba(212,169,62,0.5)' : 'rgba(255,255,255,0.10)',
                        background:
                          activeScenario === s.id ? 'rgba(212,169,62,0.08)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <p className="font-mono text-xs font-bold text-[#d4a93e]">Scenario {s.id}</p>
                      <p className="mt-1 text-sm font-bold text-white">{s.label}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={runValidation}
                  disabled={runState === 'running'}
                  className="mt-5 w-full rounded-full bg-[#d4a93e] px-7 py-4 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runState === 'running' ? 'Running…' : 'Run Ward Validation'}
                </button>
                <p className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.03] p-3 font-mono text-xs leading-5 text-[#a7c5e5]">
                  {statusText}
                </p>
              </div>

              {/* Right: 9-Check Results */}
              <div className="site-panel rounded-[30px] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">9-Check Results</p>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-sm text-[#c8dce8]">
                    {apiResult ? `${apiResult.checks_passed}/9` : `${passCount}/9`}
                  </span>
                </div>
                <div className="space-y-2">
                  {CONFORMANCE_CHECKS.map((check) => {
                    const status: CheckStatus = checkStatuses[check.id] ?? 'pending';
                    return (
                      <div
                        key={check.id}
                        className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.02] px-3 py-2.5"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] font-mono text-xs font-bold"
                          style={{
                            background:
                              status === 'pass'
                                ? '#00cc66'
                                : status === 'fail'
                                  ? '#ef4444'
                                  : 'rgba(255,255,255,0.07)',
                            color: status === 'pending' ? '#a7c5e5' : '#fff',
                          }}
                        >
                          {status === 'pass' ? '✓' : status === 'fail' ? '✗' : check.id}
                        </span>
                        <span className="text-xs leading-5 text-[#c8dce8]">{check.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ward Receipt */}
            <div className="mt-8 site-panel rounded-[30px] p-6 md:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Ward Conformance Receipt</p>
                {runState === 'done' && (
                  <a
                    href={`${XRPL_EXPLORER}/nfts/${DEMO_NFT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[#9fc6ff] hover:underline"
                  >
                    View NFT on Altnet →
                  </a>
                )}
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-[16px] border border-white/10 bg-[#07131a]/70 p-5 font-mono text-sm leading-7 text-[#c8dce8]">
                {receipt}
              </pre>
              {apiResult?.rejection_memo_hex && (
                <p className="mt-3 font-mono text-xs text-[#a7c5e5]">
                  memo_hex is an on-chain memo written to the XRPL Altnet ledger at rejection time.
                </p>
              )}
              <button
                onClick={copyReceipt}
                disabled={runState !== 'done'}
                className="mt-5 w-full rounded-full bg-[#d4a93e] px-5 py-3.5 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
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
          <div className="site-container py-24">
            <div className="mx-auto max-w-2xl">
              <div className="site-panel rounded-[34px] p-8 md:p-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-[#a7c5e5]">
                      Adapter in development
                    </span>
                    <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-white">{selectedChain.name}</h2>
                    <p className="mt-2 font-mono text-sm text-[#a7c5e5]">{selectedChain.network}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-[#f0d080]">
                    {selectedChain.status}
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-xs text-[#a7c5e5]">Deployed contract</p>
                    <p className="mt-2 break-all font-mono text-sm text-[#c8dce8]">{selectedChain.deploymentRef}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-xs text-[#a7c5e5]">Policy artifact</p>
                    <p className="mt-2 font-mono text-sm text-[#c8dce8]">{selectedChain.policyArtifact}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-xs text-[#a7c5e5]">Integration surface</p>
                    <p className="mt-2 font-mono text-sm text-[#c8dce8]">{selectedChain.integrationSurface}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-xs text-[#a7c5e5]">Full adapter</p>
                    <p className="mt-2 font-mono text-sm text-[#f0d080]">Phase 2 — Q3 2026</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {selectedChain.walletActions.slice(1).map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 font-mono text-sm text-[#c8dce8] transition hover:bg-white/[0.06]"
                    >
                      {action.label} →
                    </a>
                  ))}
                  <Link
                    href="/build"
                    className="inline-flex items-center gap-2 rounded-full bg-[#d4a93e] px-5 py-2.5 font-mono text-sm font-bold text-[#07131a] transition hover:brightness-105"
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
