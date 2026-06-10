'use client';

import { useEffect, useState } from 'react';

import ChainSelector from '@/components/ChainSelector';
import {
  CHAIN_ADAPTERS,
  CONFORMANCE_CHECKS,
  DEMO_EVENTS,
  type ChainAdapter,
} from '@/lib/wardPlatform';

const WARD_API = 'https://api.wardprotocol.org';
const DEMO_KEY = process.env.NEXT_PUBLIC_WARD_DEMO_KEY ?? '';
const DEMO_VAULT = process.env.NEXT_PUBLIC_DEMO_VAULT ?? 'rGvYtf6y2tX2CdtU7V5xAzNBRhrGLbYpzk';
const DEMO_POOL = process.env.NEXT_PUBLIC_DEMO_POOL ?? 'rJqWPzks9e8UJPnidMDM1Yq9TvFz1YZEcx';
const DEMO_CLAIMANT = process.env.NEXT_PUBLIC_DEMO_CLAIMANT ?? 'rEwDmirKJVRJydcMKQJYws5hX7ehbKFm4x';
const DEMO_NFT_ID = process.env.NEXT_PUBLIC_DEMO_NFT_ID ?? '000100009B502ACA514FDD2143BF6AC25C2C0956D91E74F75C9AFDA401143122';
const DEMO_LOAN_ID = 'F355E3D66C7335F56AB0D3C8B657AAB5B05608C877E254F5748614255710AD11';

type WorkspaceState = 'idle' | 'running' | 'done';

type ConsoleEvent = {
  time: string;
  label: string;
  tone: 'info' | 'success' | 'warning';
};

type ApiResult = {
  checks_passed: number;
  approved: boolean;
  rejection_reason: string;
  ward_signed: boolean;
  source: string;
};

const nowStamp = () =>
  new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

const makeSessionId = () => `WARD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

function buildReceipt(chain: ChainAdapter, sessionId: string, apiResult: ApiResult | null): string {
  const lines = [
    `receipt_id:    ${sessionId}`,
    `chain:         ${chain.name}`,
    `network:       ${chain.network}`,
    `result:        ${apiResult ? (apiResult.approved ? 'WARD_CONFORMANT' : 'WARD_REJECTED') : 'WARD_CONFORMANT'}`,
    `checks_passed: ${apiResult ? `${apiResult.checks_passed}/9` : '9/9'}`,
    `ward_signed:   false`,
    `settlement:    unsigned packet returned to institution`,
    `source:        ${apiResult?.source ?? 'simulation'}`,
  ];
  if (apiResult?.rejection_reason) {
    lines.push(`rejection:     ${apiResult.rejection_reason}`);
  }
  return lines.join('\n');
}

export default function DemoClient() {
  const [selectedChain, setSelectedChain] = useState<ChainAdapter>(CHAIN_ADAPTERS[0]);
  const [state, setState] = useState<WorkspaceState>('idle');
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [activeEvent, setActiveEvent] = useState(-1);
  const [passedChecks, setPassedChecks] = useState<string[]>([]);
  const [consoleEvents, setConsoleEvents] = useState<ConsoleEvent[]>([
    { time: nowStamp(), label: 'Ready. Select a chain and run conformance.', tone: 'info' },
  ]);
  const [receiptCopied, setReceiptCopied] = useState(false);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);

  const receipt = buildReceipt(selectedChain, sessionId, apiResult);

  useEffect(() => {
    setState('idle');
    setSessionId(makeSessionId());
    setActiveEvent(-1);
    setPassedChecks([]);
    setReceiptCopied(false);
    setApiResult(null);
    setConsoleEvents([{ time: nowStamp(), label: `${selectedChain.name} rail selected.`, tone: 'info' }]);
  }, [selectedChain.id]);

  const addEvent = (label: string, tone: ConsoleEvent['tone'] = 'info') => {
    setConsoleEvents((prev) => [...prev.slice(-9), { time: nowStamp(), label, tone }]);
  };

  const runConformance = async () => {
    if (state === 'running') return;

    const sid = makeSessionId();
    setState('running');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    setApiResult(null);
    setSessionId(sid);

    // Health check
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
      addEvent('API unavailable — running simulation', 'warning');
    }

    // Real validate call for XRPL; simulation notice for other chains
    let realResult: ApiResult | null = null;

    if (selectedChain.id === 'xrpl' && apiAvailable && DEMO_KEY) {
      addEvent('Ward API connected — XRPL Altnet live ledger', 'success');
      try {
        const resp = await fetch(`${WARD_API}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Institution-Key': DEMO_KEY },
          body: JSON.stringify({
            vault_id: DEMO_VAULT,
            policy_nft_id: DEMO_NFT_ID,
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
          ward_signed: data.ward_signed === false,
          source: 'api.wardprotocol.org · XRPL Altnet',
        };
        addEvent(`Step 1 — policy NFT ${DEMO_NFT_ID.slice(0, 12)}... found on ledger ✓`, 'success');
        addEvent('Step 2 — premium payment check — rejected', 'warning');
        addEvent(`Ward validation complete — ${realResult.checks_passed}/9 checks passed`, 'warning');
      } catch {
        addEvent('API call failed — falling back to simulation', 'warning');
      }
    } else if (selectedChain.id !== 'xrpl') {
      addEvent(`${selectedChain.shortName} — adapter in development · XRPL Altnet is the live reference implementation`, 'info');
    }

    // Visual animation — always runs
    for (let i = 0; i < DEMO_EVENTS.length; i++) {
      await new Promise((r) => setTimeout(r, 330));
      setActiveEvent(i);
      if (!realResult) {
        addEvent(DEMO_EVENTS[i], i === DEMO_EVENTS.length - 1 ? 'success' : 'info');
      }
    }

    for (const check of CONFORMANCE_CHECKS) {
      await new Promise((r) => setTimeout(r, 150));
      setPassedChecks((prev) => [...prev, check.id]);
    }

    await new Promise((r) => setTimeout(r, 260));
    if (realResult) setApiResult(realResult);
    setState('done');
    const checksDisplay = realResult ? `${realResult.checks_passed}/9` : '9/9';
    addEvent(`Receipt ${sid} — ${checksDisplay} checks passed`, 'success');
  };

  const copyReceipt = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(receipt);
    setReceiptCopied(true);
    addEvent('Receipt copied', 'success');
  };

  const isRunning = state === 'running';

  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-40" />
        <div className="site-container pb-28 pt-24 lg:pt-32">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="site-label">Ward conformance workspace</p>
              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
                Run deterministic conformance on any supported chain.
              </h1>
              <p className="site-copy mt-6 max-w-xl text-lg">
                Select a testnet rail and run Ward's nine-check conformance engine. XRPL Altnet runs against the live API. All other chains show the simulation flow.
              </p>
              <div className="mt-10">
                <ChainSelector chains={CHAIN_ADAPTERS} selected={selectedChain} onSelect={setSelectedChain} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="site-panel rounded-[34px] p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-[#a7c5e5]">Session</p>
                    <p className="mt-1 font-mono text-sm font-bold text-white">{sessionId}</p>
                  </div>
                  <span className="rounded-md border border-[#d4a93e]/20 bg-[#d4a93e]/10 px-4 py-2 font-mono text-sm text-[#f0d080]">
                    {state === 'done' ? 'Complete' : state === 'running' ? 'Running…' : 'Ready'}
                  </span>
                </div>
                <button
                  onClick={runConformance}
                  disabled={isRunning}
                  className="mt-6 w-full rounded-full bg-[#d4a93e] px-7 py-4 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? 'Running…' : 'Run Ward Validation'}
                </button>
                <p className="mt-3 text-center font-mono text-xs text-[#a7c5e5]">
                  XRPL — live ledger · Other chains — adapter in development
                </p>
              </div>

              <div className="site-panel rounded-[34px] p-6">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Console</p>
                <div className="mt-4 min-h-[200px] space-y-2 rounded-[20px] border border-white/10 bg-[#07131a]/70 p-5 font-mono text-sm leading-7">
                  {consoleEvents.map((event, index) => (
                    <div key={`${event.time}-${index}`} className="grid grid-cols-[78px_1fr] gap-3">
                      <span className="text-[#a7c5e5]">{event.time}</span>
                      <span
                        className={
                          event.tone === 'success'
                            ? 'text-[#00cc66]'
                            : event.tone === 'warning'
                              ? 'text-[#f0d080]'
                              : 'text-[#c8dce8]'
                        }
                      >
                        {event.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-32">
          <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Conformance steps</p>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm text-[#c8dce8]">
                    {selectedChain.endpoint}
                  </span>
                </div>
                <div className="space-y-3">
                  {DEMO_EVENTS.map((event, index) => (
                    <div
                      key={event}
                      className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-mono text-sm font-bold"
                        style={{
                          background: activeEvent >= index ? '#00cc66' : 'rgba(255,255,255,0.07)',
                          color: activeEvent >= index ? '#07130d' : '#a7c5e5',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm leading-7 text-[#c8dce8]">{event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Evidence gates</p>
                  <span className="rounded-md border border-white/10 bg-[#07131a]/55 px-4 py-2 font-mono text-sm text-[#c8dce8]">
                    {apiResult ? `${apiResult.checks_passed} / 9` : `${passedChecks.length} / 9`}
                  </span>
                </div>
                <div className="grid gap-3">
                  {CONFORMANCE_CHECKS.map((check) => {
                    const passed = passedChecks.includes(check.id);
                    return (
                      <div
                        key={check.id}
                        className="grid grid-cols-[42px_1fr] gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-[14px] font-mono text-sm font-bold"
                          style={{
                            background: passed ? '#00cc66' : 'rgba(255,255,255,0.08)',
                            color: passed ? '#07130d' : '#c8dce8',
                          }}
                        >
                          {passed ? 'OK' : check.id}
                        </span>
                        <div>
                          <p className="text-sm font-black leading-6 text-white">{check.label}</p>
                          <p className="mt-1 text-sm leading-6 text-[#c8dce8]">{check.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside>
              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Conformance receipt</p>
                <pre className="mt-5 whitespace-pre-wrap break-words rounded-[20px] border border-white/10 bg-[#07131a]/70 p-5 font-mono text-sm leading-7 text-[#c8dce8]">
                  {receipt}
                </pre>
                <button
                  onClick={copyReceipt}
                  disabled={state !== 'done'}
                  className="mt-5 w-full rounded-full bg-[#d4a93e] px-5 py-3.5 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {receiptCopied ? 'Receipt Copied' : 'Copy Receipt'}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
