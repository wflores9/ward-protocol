'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import ChainSelector from '@/components/ChainSelector';
import ChainLogo from '@/components/ChainLogo';
import {
  CHAIN_ADAPTERS,
  CONFORMANCE_CHECKS,
  DEMO_EVENTS,
  INTEGRATION_PROFILES,
  type ChainAdapter,
  type IntegrationProfile,
} from '@/lib/wardPlatform';

const WalletConnector = dynamic(() => import('@/components/WalletConnector'), { ssr: false });
const LiveValidator = dynamic(() => import('@/components/LiveValidator'), { ssr: false });

type WorkspaceState = 'empty' | 'wallet-ready' | 'adapter-ready' | 'running' | 'receipt-ready';

type ConsoleEvent = {
  time: string;
  label: string;
  tone: 'info' | 'success' | 'warning';
};

const nowStamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const makeSessionId = () => `WARD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
const makeWallet = (chain: ChainAdapter) => `${chain.sampleAddress}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

function buildPayload(chain: ChainAdapter, profile: IntegrationProfile, walletAddress: string | null) {
  return JSON.stringify(
    {
      chain: chain.id,
      network: chain.network,
      integration_surface: chain.integrationSurface,
      project: profile.id,
      wallet_address: walletAddress || 'provision_sandbox_wallet_first',
      policy_ref: chain.primitiveRef,
      vault: profile.vault,
      claim_context: profile.claim,
      signer_boundary: 'institution',
      ward_signed: false,
    },
    null,
    2,
  );
}

function buildReceipt(chain: ChainAdapter, profile: IntegrationProfile, sessionId: string, walletAddress: string | null) {
  return [
    `receipt_id: ${sessionId}`,
    `chain: ${chain.name}`,
    `network: ${chain.network}`,
    `project: ${profile.name}`,
    `vault: ${profile.vault}`,
    `wallet: ${walletAddress || 'sandbox wallet pending'}`,
    'result: WARD_CONFORMANT',
    'checks_passed: 9/9',
    'ward_signed: false',
    'settlement_packet: unsigned',
    'signer_boundary: institution',
  ].join('\n');
}

export default function DemoClient() {
  const [selectedChain, setSelectedChain] = useState<ChainAdapter>(CHAIN_ADAPTERS[0]);
  const [selectedProfile, setSelectedProfile] = useState<IntegrationProfile>(INTEGRATION_PROFILES[0]);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('empty');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [activeEvent, setActiveEvent] = useState(-1);
  const [passedChecks, setPassedChecks] = useState<string[]>([]);
  const [consoleEvents, setConsoleEvents] = useState<ConsoleEvent[]>([
    { time: nowStamp(), label: 'Workspace ready. Select a rail, create a sandbox wallet, and run conformance.', tone: 'info' },
  ]);
  const [receiptCopied, setReceiptCopied] = useState(false);

  const payload = useMemo(
    () => buildPayload(selectedChain, selectedProfile, walletAddress),
    [selectedChain, selectedProfile, walletAddress],
  );
  const receipt = useMemo(
    () => buildReceipt(selectedChain, selectedProfile, sessionId, walletAddress),
    [selectedChain, selectedProfile, sessionId, walletAddress],
  );

  useEffect(() => {
    setWorkspaceState('empty');
    setWalletAddress(null);
    setSessionId(makeSessionId());
    setActiveEvent(-1);
    setPassedChecks([]);
    setReceiptCopied(false);
    setConsoleEvents([
      {
        time: nowStamp(),
        label: `${selectedChain.name} rail selected. Workspace reset for a clean institutional review path.`,
        tone: 'info',
      },
    ]);
  }, [selectedChain.id]);

  const addEvent = (label: string, tone: ConsoleEvent['tone'] = 'info') => {
    setConsoleEvents((current) => [...current.slice(-11), { time: nowStamp(), label, tone }]);
  };

  const provisionWallet = () => {
    const nextWallet = makeWallet(selectedChain);
    setWalletAddress(nextWallet);
    setWorkspaceState('wallet-ready');
    setSessionId(makeSessionId());
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    addEvent(`Sandbox institution wallet created: ${nextWallet}`, 'success');
  };

  const attachAdapter = () => {
    if (!walletAddress) provisionWallet();
    setWorkspaceState('adapter-ready');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    addEvent(`${selectedChain.shortName} rail bound to ${selectedChain.network}`, 'success');
  };

  const runConformance = async () => {
    if (workspaceState === 'running') return;

    if (!walletAddress) {
      const nextWallet = makeWallet(selectedChain);
      setWalletAddress(nextWallet);
      addEvent(`Sandbox institution wallet created: ${nextWallet}`, 'success');
    }

    setWorkspaceState('running');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);

    for (let i = 0; i < DEMO_EVENTS.length; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 330));
      setActiveEvent(i);
      addEvent(DEMO_EVENTS[i], i === DEMO_EVENTS.length - 1 ? 'success' : 'info');
    }

    for (const check of CONFORMANCE_CHECKS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setPassedChecks((current) => [...current, check.id]);
    }

    await new Promise((resolve) => setTimeout(resolve, 260));
    setWorkspaceState('receipt-ready');
    addEvent(`Conformance receipt ${sessionId} issued with 9/9 checks passed`, 'success');
  };

  const copyReceipt = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(receipt);
      setReceiptCopied(true);
      addEvent('Receipt copied for engineering, compliance, and partner review', 'success');
    }
  };

  const stateLabel =
    workspaceState === 'receipt-ready'
      ? 'Conformant'
      : workspaceState === 'running'
        ? 'Running'
        : workspaceState === 'adapter-ready'
          ? 'Adapter attached'
          : workspaceState === 'wallet-ready'
            ? 'Wallet ready'
            : 'Workspace ready';

  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 md:px-10 lg:px-12 lg:pt-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="site-label">Ward conformance workspace</p>
              <h1 className="mt-5 text-5xl font-black leading-[1.03] tracking-[-0.03em] text-white md:text-6xl">
                A demo environment institutions can actually inspect.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d0dde0] md:text-xl">
                Select a live testnet rail, create a sandbox institution wallet, run deterministic conformance, and export a receipt that preserves the signer boundary from start to finish.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                {[
                  '8 live testnet rails',
                  '9 deterministic checks',
                  'Unsigned settlement packet',
                  'ward_signed = False',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[#d0dde0]">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={provisionWallet}
                  className="inline-flex min-h-12 items-center rounded-full bg-[#f7f9f7] px-6 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
                >
                  Create sandbox wallet
                </button>
                <button
                  onClick={runConformance}
                  disabled={workspaceState === 'running'}
                  className="inline-flex min-h-12 items-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Run conformance
                </button>
              </div>
            </div>

            <div className="site-panel rounded-[32px] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} selected`} className="h-14 w-14" />
                  <div>
                    <p className="font-mono text-sm text-[#9eb0b7]">Active rail</p>
                    <h2 className="text-2xl font-black text-white">{selectedChain.name}</h2>
                  </div>
                </div>
                <span className="rounded-full border border-[#d4a93e]/20 bg-[#d4a93e]/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#f0d080]">
                  {stateLabel}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['Network', selectedChain.network],
                  ['Primitive', selectedChain.primitive],
                  ['Finality', selectedChain.finality],
                  ['Integration surface', selectedChain.integrationSurface],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9eb0b7]">{label}</p>
                    <p className="mt-2 text-base font-bold leading-6 text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#d4a93e]">Choose a live testnet rail</p>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#d0dde0]">
                      The same default-resolution workflow runs across every supported rail. Select the environment your team wants to inspect.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#07131a]/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#d0dde0]">
                    {CHAIN_ADAPTERS.length} rails
                  </span>
                </div>
                <ChainSelector chains={CHAIN_ADAPTERS} selected={selectedChain} onSelect={setSelectedChain} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
            <div>
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Session control plane</p>
              <p className="mt-1 text-sm leading-6 text-[#d0dde0]">
                Current session is pinned to <span className="font-bold text-white">{selectedChain.name}</span> for deterministic conformance review.
              </p>
            </div>
            <p className="rounded-full border border-white/10 bg-[#07131a]/55 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#d0dde0]">
              Session {sessionId}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
            <aside className="space-y-4">
              <div className="site-panel-muted rounded-[28px] p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Project profile</p>
                <div className="mt-4 grid gap-3">
                  {INTEGRATION_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className="rounded-[20px] border p-4 text-left transition"
                      style={{
                        borderColor: selectedProfile.id === profile.id ? '#d4a93e' : 'rgba(255,255,255,0.10)',
                        background: selectedProfile.id === profile.id ? 'rgba(212,169,62,0.12)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <p className="text-base font-black text-white">{profile.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[#d0dde0]">{profile.value}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="site-panel-muted rounded-[28px] p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Workspace controls</p>
                <div className="mt-4 grid gap-3">
                  <button onClick={provisionWallet} className="rounded-full bg-[#f7f9f7] px-4 py-3 text-base font-bold text-[#07131a] transition hover:bg-white">
                    Create demo wallet
                  </button>
                  <button onClick={attachAdapter} className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]">
                    Bind rail
                  </button>
                  <button
                    onClick={runConformance}
                    disabled={workspaceState === 'running'}
                    className="rounded-full bg-[#d4a93e] px-4 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Run conformance
                  </button>
                </div>

                <div className="mt-5 rounded-[20px] border border-white/10 bg-[#07131a]/55 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9eb0b7]">Sandbox wallet</p>
                  <p className="mt-2 break-words font-mono text-sm font-bold leading-6 text-white">
                    {walletAddress || 'Not provisioned'}
                  </p>
                </div>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="site-panel rounded-[28px] p-5 md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">Rail terminal</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Conformance job trace</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#d0dde0]">
                    {selectedChain.endpoint}
                  </span>
                </div>

                <div className="min-h-[280px] space-y-2 font-mono text-sm leading-6">
                  {consoleEvents.map((event, index) => (
                    <div key={`${event.time}-${index}`} className="grid grid-cols-[74px_1fr] gap-3">
                      <span className="text-[#9eb0b7]">{event.time}</span>
                      <span className={event.tone === 'success' ? 'text-[#00cc66]' : event.tone === 'warning' ? 'text-[#f0d080]' : 'text-[#d0dde0]'}>
                        {event.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-2">
                  {DEMO_EVENTS.map((event, index) => (
                    <div key={event} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl font-mono text-sm font-bold"
                        style={{
                          background: activeEvent >= index ? '#00cc66' : 'rgba(255,255,255,0.07)',
                          color: activeEvent >= index ? '#07130d' : '#d0dde0',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-[#d0dde0]">{event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="site-panel-muted rounded-[28px] p-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">API payload</p>
                  <pre className="mt-4 max-h-[420px] overflow-x-auto rounded-[20px] border border-white/10 bg-[#07131a]/70 p-4 font-mono text-sm leading-7 text-[#d0dde0]">
                    <code>{payload}</code>
                  </pre>
                </div>

                <div className="site-panel-muted rounded-[28px] p-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Project integration</p>
                  <h3 className="mt-3 text-2xl font-black text-white">{selectedProfile.name}</h3>
                  <p className="mt-3 text-base leading-7 text-[#d0dde0]">{selectedProfile.integrationGoal}</p>
                  <div className="mt-5 grid gap-3">
                    {[
                      ['Sector', selectedProfile.sector],
                      ['Vault', selectedProfile.vault],
                      ['Claim', selectedProfile.claim],
                      ['Capacity', selectedProfile.value],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9eb0b7]">{label}</p>
                        <p className="mt-2 text-base font-bold leading-6 text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="site-panel-muted rounded-[28px] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#d4a93e]">Conformance receipt</p>
                    <h2 className="mt-1 text-2xl font-black text-white">{stateLabel}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#07131a]/55 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#d0dde0]">
                    9 / 9
                  </span>
                </div>

                <div className="grid gap-2">
                  {CONFORMANCE_CHECKS.map((check) => {
                    const passed = passedChecks.includes(check.id);

                    return (
                      <div key={check.id} className="grid grid-cols-[38px_1fr] gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl font-mono text-sm font-bold"
                          style={{
                            background: passed ? '#00cc66' : 'rgba(255,255,255,0.08)',
                            color: passed ? '#07130d' : '#d0dde0',
                          }}
                        >
                          {passed ? 'OK' : check.id}
                        </span>
                        <div>
                          <p className="text-sm font-black leading-5 text-white">{check.label}</p>
                          <p className="mt-1 text-sm leading-5 text-[#d0dde0]">{check.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={copyReceipt}
                  disabled={workspaceState !== 'receipt-ready'}
                  className="mt-4 w-full rounded-full bg-[#d4a93e] px-4 py-3 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {receiptCopied ? 'Receipt copied' : 'Copy receipt'}
                </button>
              </div>

              <div className="site-panel rounded-[28px] p-5">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Receipt preview</p>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[20px] border border-white/10 bg-[#07131a]/70 p-4 font-mono text-sm leading-7 text-[#d0dde0]">
                  {receipt}
                </pre>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="live-playground" className="site-section">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
          <div className="mb-8 max-w-3xl">
            <p className="site-label">Live rail validation</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
              XRPL runs live Altnet wallet validation. Every other rail stays aligned to the same conformance model.
            </h2>
          </div>

          {selectedChain.id === 'xrpl' ? (
            <div className="site-panel rounded-[32px] p-5 text-[#f7f9f7] md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">XRPL Altnet wallet connect</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Run against Ward policy NFTs</h3>
                </div>
                <WalletConnector />
              </div>
              <LiveValidator />
            </div>
          ) : (
            <div className="site-panel-muted rounded-[32px] p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} adapter`} className="h-14 w-14" />
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">{selectedChain.status}</p>
                    <h3 className="text-2xl font-black text-white">{selectedChain.name} rail path</h3>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-7 text-[#d0dde0]">
                  {selectedChain.wallet} integration uses the same conformance payload and receipt model while production wallet submission is finalized for this rail.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
