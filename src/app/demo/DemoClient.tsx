'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

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
      adapter: chain.adapterPackage,
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
    { time: nowStamp(), label: 'Console ready. Select a chain adapter and provision a sandbox wallet.', tone: 'info' },
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
        label: `${selectedChain.name} adapter selected. Workspace reset for a clean conformance session.`,
        tone: 'info',
      },
    ]);
  }, [selectedChain.id]);

  const addEvent = (label: string, tone: ConsoleEvent['tone'] = 'info') => {
    setConsoleEvents((current) => [...current.slice(-9), { time: nowStamp(), label, tone }]);
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
    addEvent(`${selectedChain.adapterPackage} attached to ${selectedChain.network}`, 'success');
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
      addEvent('Receipt copied for risk, compliance, and engineering review', 'success');
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
            : 'Workspace empty';

  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] text-[#f7faf8]">
        <img src="/brand/ward-banner.png" alt="Ward Protocol integration console" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-[#14242b]/80" />
        <div className="absolute inset-0 grid-overlay" />

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-[0.95fr_1.05fr] md:px-10 lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Ward Integration Console</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              Self-demo Ward like an infrastructure integration, not a slideshow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
              Provision a sandbox wallet, attach a chain adapter, run deterministic conformance, and export a receipt that proves Ward never signs or decides outcomes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={provisionWallet}
                className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white"
              >
                Create Sandbox Wallet
              </button>
              <button
                onClick={runConformance}
                disabled={workspaceState === 'running'}
                className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Run Conformance Session
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#0f1f25]/90 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#b6d7ce]/10 pb-4">
              <div className="flex items-center gap-4">
                <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} selected`} className="h-14 w-14" />
                <div>
                  <p className="font-mono text-sm text-[#a9bdb8]">Selected adapter</p>
                  <h2 className="text-2xl font-black text-[#f7faf8]">{selectedChain.name}</h2>
                </div>
              </div>
              <span className="rounded-md border border-[#d4a93e]/30 bg-[#d4a93e]/10 px-3 py-1.5 font-mono text-sm font-bold text-[#d4a93e]">
                {stateLabel}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Wallet lane', selectedChain.wallet],
                ['Primitive', selectedChain.primitive],
                ['Finality', selectedChain.finality],
                ['Endpoint', selectedChain.endpoint],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-4">
                  <p className="font-mono text-sm text-[#a9bdb8]">{label}</p>
                  <p className="mt-2 text-base font-bold leading-6 text-[#f7faf8]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 border-b border-[#14242b]/10 bg-[#f6f4ee]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 md:px-10 lg:px-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-black text-[#14242b]">Chain adapter lanes</p>
            <p className="font-mono text-sm text-[#52665f]">Session: {sessionId}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {CHAIN_ADAPTERS.map((chain) => {
              const isSelected = selectedChain.id === chain.id;
              return (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain)}
                  className="min-h-[132px] rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(20,36,43,0.12)]"
                  style={{
                    borderColor: isSelected ? chain.accent : 'rgba(20,36,43,0.14)',
                    boxShadow: isSelected ? `0 0 0 3px ${chain.accentSoft}` : undefined,
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-11 w-11" />
                    <span className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] px-2 py-1 font-mono text-sm font-bold text-[#3f534d]">
                      {chain.status}
                    </span>
                  </div>
                  <p className="text-base font-black leading-5 text-[#14242b]">{chain.name}</p>
                  <p className="mt-2 text-sm leading-5 text-[#52665f]">{chain.wallet}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:px-10 lg:grid-cols-[330px_1fr_380px] lg:px-12">
          <aside className="space-y-4">
            <div className="rounded-lg border border-[#14242b]/10 bg-white p-5">
              <p className="font-mono text-sm font-bold text-[#9b6d13]">Project profile</p>
              <div className="mt-4 grid gap-3">
                {INTEGRATION_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className="rounded-md border p-4 text-left transition hover:border-[#14242b]/40"
                    style={{
                      borderColor: selectedProfile.id === profile.id ? '#d4a93e' : 'rgba(20,36,43,0.12)',
                      background: selectedProfile.id === profile.id ? 'rgba(212,169,62,0.12)' : '#ffffff',
                    }}
                  >
                    <p className="text-base font-black text-[#14242b]">{profile.name}</p>
                    <p className="mt-1 text-sm leading-5 text-[#52665f]">{profile.value}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#14242b]/10 bg-white p-5">
              <p className="font-mono text-sm font-bold text-[#9b6d13]">Sandbox controls</p>
              <div className="mt-4 space-y-3">
                <button onClick={provisionWallet} className="w-full rounded-md bg-[#14242b] px-4 py-3 text-base font-bold text-white transition hover:bg-[#1d3035]">
                  Create Demo Wallet
                </button>
                <button onClick={attachAdapter} className="w-full rounded-md border border-[#14242b]/20 px-4 py-3 text-base font-bold text-[#14242b] transition hover:border-[#14242b]/40 hover:bg-[#14242b]/5">
                  Attach Adapter
                </button>
                <button
                  onClick={runConformance}
                  disabled={workspaceState === 'running'}
                  className="w-full rounded-md bg-[#d4a93e] px-4 py-3 text-base font-bold text-[#14242b] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Run Conformance
                </button>
              </div>
              <div className="mt-5 rounded-md border border-[#14242b]/10 bg-[#f6f4ee] p-4">
                <p className="font-mono text-sm text-[#52665f]">Demo wallet</p>
                <p className="mt-2 break-words font-mono text-sm font-bold leading-6 text-[#14242b]">
                  {walletAddress || 'Not provisioned'}
                </p>
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-lg border border-[#14242b]/10 bg-[#101d23] p-5 text-[#f7faf8]">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#b6d7ce]/10 pb-4">
                <div>
                  <p className="font-mono text-sm text-[#d4a93e]">Adapter terminal</p>
                  <h2 className="mt-1 text-2xl font-black">Live-style integration trace</h2>
                </div>
                <span className="rounded-md border border-[#b6d7ce]/20 px-3 py-1.5 font-mono text-sm text-[#d2e1dd]">
                  {selectedChain.adapterPackage}
                </span>
              </div>

              <div className="min-h-[320px] space-y-2 font-mono text-sm leading-6">
                {consoleEvents.map((event, index) => (
                  <div key={`${event.time}-${index}`} className="grid grid-cols-[76px_1fr] gap-3">
                    <span className="text-[#a9bdb8]">{event.time}</span>
                    <span className={event.tone === 'success' ? 'text-[#00cc66]' : event.tone === 'warning' ? 'text-[#d4a93e]' : 'text-[#d2e1dd]'}>
                      {event.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {DEMO_EVENTS.map((event, index) => (
                  <div key={event} className="flex items-center gap-3 rounded-md border border-[#b6d7ce]/10 bg-[#f7faf8]/10 px-3 py-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-md font-mono text-sm font-bold"
                      style={{
                        background: activeEvent >= index ? '#00cc66' : 'rgba(247,250,248,0.08)',
                        color: activeEvent >= index ? '#07130d' : '#d2e1dd',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-[#d2e1dd]">{event}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#14242b]/10 bg-white p-5">
                <p className="font-mono text-sm font-bold text-[#9b6d13]">API payload</p>
                <pre className="mt-4 max-h-[420px] overflow-x-auto rounded-md bg-[#101d23] p-4 font-mono text-sm leading-7 text-[#d2e1dd]">
                  <code>{payload}</code>
                </pre>
              </div>

              <div className="rounded-lg border border-[#14242b]/10 bg-white p-5">
                <p className="font-mono text-sm font-bold text-[#9b6d13]">Project integration</p>
                <h3 className="mt-3 text-2xl font-black text-[#14242b]">{selectedProfile.name}</h3>
                <p className="mt-3 text-base leading-7 text-[#52665f]">{selectedProfile.integrationGoal}</p>
                <div className="mt-5 grid gap-3">
                  {[
                    ['Sector', selectedProfile.sector],
                    ['Vault', selectedProfile.vault],
                    ['Claim', selectedProfile.claim],
                    ['Capacity', selectedProfile.value],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] p-3">
                      <p className="font-mono text-sm text-[#52665f]">{label}</p>
                      <p className="mt-1 text-base font-bold leading-6 text-[#14242b]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#14242b]/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-[#9b6d13]">Conformance receipt</p>
                  <h2 className="mt-1 text-2xl font-black text-[#14242b]">{stateLabel}</h2>
                </div>
                <span className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] px-3 py-1.5 font-mono text-sm font-bold text-[#3f534d]">
                  9 / 9
                </span>
              </div>

              <div className="grid gap-2">
                {CONFORMANCE_CHECKS.map((check) => {
                  const passed = passedChecks.includes(check.id);
                  return (
                    <div key={check.id} className="grid grid-cols-[38px_1fr] gap-3 rounded-md border border-[#14242b]/10 bg-[#f6f4ee] p-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-md font-mono text-sm font-bold"
                        style={{
                          background: passed ? '#00cc66' : '#ffffff',
                          color: passed ? '#07130d' : '#52665f',
                        }}
                      >
                        {passed ? 'OK' : check.id}
                      </span>
                      <div>
                        <p className="text-sm font-black leading-5 text-[#14242b]">{check.label}</p>
                        <p className="mt-1 text-sm leading-5 text-[#52665f]">{check.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={copyReceipt}
                disabled={workspaceState !== 'receipt-ready'}
                className="mt-4 w-full rounded-md bg-[#14242b] px-4 py-3 text-base font-bold text-white transition hover:bg-[#1d3035] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {receiptCopied ? 'Receipt Copied' : 'Copy Receipt'}
              </button>
            </div>

            <div className="rounded-lg border border-[#14242b]/10 bg-[#101d23] p-5 text-[#f7faf8]">
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Receipt preview</p>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-[#d2e1dd]">{receipt}</pre>
            </div>
          </aside>
        </div>
      </section>

      <section id="live-playground" className="border-y border-[#b6d7ce]/10 bg-[#14242b] py-14 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-8 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#d4a93e]">Live adapter lane</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              XRPL can connect to live Altnet wallet validation. Other lanes show integration readiness.
            </h2>
          </div>

          {selectedChain.id === 'xrpl' ? (
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8] p-5 text-[#14242b]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-[#9b6d13]">XRPL Altnet wallet connect</p>
                  <h3 className="mt-2 text-2xl font-black">Run against Ward policy NFTs</h3>
                </div>
                <WalletConnector />
              </div>
              <LiveValidator />
            </div>
          ) : (
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} adapter`} className="h-14 w-14" />
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">{selectedChain.status}</p>
                    <h3 className="text-2xl font-black text-[#f7faf8]">{selectedChain.name} adapter path</h3>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-7 text-[#d2e1dd]">
                  {selectedChain.wallet} integration uses the same conformance payload and receipt model while production wallet submission is finalized for this lane.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
