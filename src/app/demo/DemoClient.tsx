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

type WorkspaceState = 'empty' | 'wallet-ready' | 'policy-ready' | 'rail-ready' | 'running' | 'receipt-ready';

type ConsoleEvent = {
  time: string;
  label: string;
  tone: 'info' | 'success' | 'warning';
};

const nowStamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const makeSessionId = () => `WARD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
const makeWallet = (chain: ChainAdapter) => `${chain.sampleAddress}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
const makePolicyId = (chain: ChainAdapter) => `${chain.policyPrefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
const WORKFLOW_STEPS = [
  ['01', 'Select a rail', 'Pick the network lane your team wants to inspect.'],
  ['02', 'Create the policy artifact', 'Generate a demo policy NFT, contract reference, asset, or mint for the selected rail.'],
  ['03', 'Run and review', 'Execute conformance and inspect the resulting evidence gates and receipt.'],
] as const;

const INTEGRATION_ACTIONS = [
  {
    label: 'Python SDK',
    command: 'pip install ward-protocol==0.2.6',
    body: 'Backend validators, vault monitors, conformance jobs, and receipt export.',
  },
  {
    label: 'TypeScript SDK',
    command: 'npm install @wardprotocol/sdk',
    body: 'Product consoles, wallet flows, selected-rail orchestration, and dashboards.',
  },
  {
    label: 'Hosted API',
    command: 'POST https://api.wardprotocol.org/conformance/run',
    body: 'Pilot integrations that need Ward-managed infrastructure and enterprise onboarding.',
  },
] as const;

function buildPayload(chain: ChainAdapter, profile: IntegrationProfile, walletAddress: string | null, policyId: string | null) {
  return JSON.stringify(
    {
      chain: chain.id,
      network: chain.network,
      integration_surface: chain.integrationSurface,
      project: profile.id,
      wallet_address: walletAddress || 'provision_sandbox_wallet_first',
      policy_artifact: chain.policyArtifact,
      policy_ref: policyId || 'create_demo_policy_artifact_first',
      vault: profile.vault,
      claim_context: profile.claim,
      signer_boundary: 'institution',
      ward_signed: false,
    },
    null,
    2,
  );
}

function buildReceipt(chain: ChainAdapter, profile: IntegrationProfile, sessionId: string, walletAddress: string | null, policyId: string | null) {
  return [
    `receipt_id: ${sessionId}`,
    `chain: ${chain.name}`,
    `network: ${chain.network}`,
    `project: ${profile.name}`,
    `vault: ${profile.vault}`,
    `wallet: ${walletAddress || 'sandbox wallet pending'}`,
    `policy_artifact: ${policyId || 'demo policy pending'}`,
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
  const [policyId, setPolicyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [activeEvent, setActiveEvent] = useState(-1);
  const [passedChecks, setPassedChecks] = useState<string[]>([]);
  const [consoleEvents, setConsoleEvents] = useState<ConsoleEvent[]>([
    { time: nowStamp(), label: 'Workspace ready. Select a rail, create a sandbox wallet, and run conformance.', tone: 'info' },
  ]);
  const [receiptCopied, setReceiptCopied] = useState(false);
  const [integrationCopied, setIntegrationCopied] = useState<string | null>(null);

  const payload = useMemo(
    () => buildPayload(selectedChain, selectedProfile, walletAddress, policyId),
    [selectedChain, selectedProfile, walletAddress, policyId],
  );
  const receipt = useMemo(
    () => buildReceipt(selectedChain, selectedProfile, sessionId, walletAddress, policyId),
    [selectedChain, selectedProfile, sessionId, walletAddress, policyId],
  );

  useEffect(() => {
    setWorkspaceState('empty');
    setWalletAddress(null);
    setPolicyId(null);
    setSessionId(makeSessionId());
    setActiveEvent(-1);
    setPassedChecks([]);
    setReceiptCopied(false);
    setIntegrationCopied(null);
    setConsoleEvents([
      {
        time: nowStamp(),
        label: `${selectedChain.name} rail selected. Workspace reset for a clean institutional review path.`,
        tone: 'info',
      },
    ]);
  }, [selectedChain.id]);

  const addEvent = (label: string, tone: ConsoleEvent['tone'] = 'info') => {
    setConsoleEvents((current) => [...current.slice(-7), { time: nowStamp(), label, tone }]);
  };

  const provisionWallet = () => {
    const nextWallet = makeWallet(selectedChain);
    setWalletAddress(nextWallet);
    setWorkspaceState('wallet-ready');
    setSessionId(makeSessionId());
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    setIntegrationCopied(null);
    addEvent(`Sandbox institution wallet created: ${nextWallet}`, 'success');
    return nextWallet;
  };

  const createPolicyArtifact = (ensureWallet = true) => {
    if (ensureWallet && !walletAddress) provisionWallet();

    const nextPolicy = makePolicyId(selectedChain);
    setPolicyId(nextPolicy);
    setWorkspaceState('policy-ready');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    setIntegrationCopied(null);
    addEvent(`${selectedChain.policyArtifact} created for ${selectedChain.shortName}: ${nextPolicy}`, 'success');
    return nextPolicy;
  };

  const attachAdapter = () => {
    if (!walletAddress) provisionWallet();
    if (!policyId) createPolicyArtifact(false);

    setWorkspaceState('rail-ready');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);
    setIntegrationCopied(null);
    addEvent(`${selectedChain.shortName} rail bound to ${selectedChain.network} with policy evidence`, 'success');
  };

  const runConformance = async () => {
    if (workspaceState === 'running') return;

    const runWallet = walletAddress || provisionWallet();
    const runPolicy = policyId || createPolicyArtifact(false);

    if (workspaceState === 'empty' || workspaceState === 'wallet-ready' || workspaceState === 'policy-ready') {
      setWorkspaceState('rail-ready');
      addEvent(`${selectedChain.shortName} rail bound to ${selectedChain.network} with ${runPolicy}`, 'success');
    }

    setWorkspaceState('running');
    setPassedChecks([]);
    setActiveEvent(-1);
    setReceiptCopied(false);

    for (let index = 0; index < DEMO_EVENTS.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 330));
      setActiveEvent(index);
      addEvent(DEMO_EVENTS[index], index === DEMO_EVENTS.length - 1 ? 'success' : 'info');
    }

    for (const check of CONFORMANCE_CHECKS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setPassedChecks((current) => [...current, check.id]);
    }

    await new Promise((resolve) => setTimeout(resolve, 260));
    setWorkspaceState('receipt-ready');
    addEvent(`Conformance receipt ${sessionId} issued for ${runWallet} with 9/9 checks passed`, 'success');
  };

  const copyReceipt = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(receipt);
      setReceiptCopied(true);
      addEvent('Receipt copied for engineering, compliance, and partner review', 'success');
    }
  };

  const copyIntegrationAction = async (label: string, command: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(command);
      setIntegrationCopied(label);
      addEvent(`${label} integration command copied`, 'success');
    }
  };

  const stateLabel =
    workspaceState === 'receipt-ready'
      ? 'Conformant'
        : workspaceState === 'running'
          ? 'Running'
        : workspaceState === 'rail-ready'
          ? 'Rail bound'
          : workspaceState === 'policy-ready'
            ? 'Policy ready'
          : workspaceState === 'wallet-ready'
            ? 'Wallet ready'
            : 'Workspace ready';

  return (
    <main className="site-shell text-[#f7f9f7]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-70" />
        <div className="site-container pb-20 pt-24 lg:pt-32">
          <div className="grid gap-16 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="site-label">Ward conformance workspace</p>
              <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white md:text-6xl lg:text-[5rem]">
                A premium sandbox for institutional default-resolution review.
              </h1>
              <p className="site-copy mt-8 text-lg md:text-[1.2rem]">
                Select a testnet rail, create a demo policy artifact, run deterministic conformance, and export a receipt that preserves the signer boundary from start to finish.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                {[
                  '8 testnet rails',
                  '9 deterministic checks',
                  'Unsigned settlement packet',
                  'ward_signed = False',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[#d0dde0]">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => createPolicyArtifact()}
                  className="inline-flex min-h-14 items-center rounded-full bg-[#f7f9f7] px-7 py-3 text-base font-bold text-[#07131a] transition hover:bg-white"
                >
                  Create Demo Policy NFT
                </button>
                <button
                  onClick={runConformance}
                  disabled={workspaceState === 'running'}
                  className="inline-flex min-h-14 items-center rounded-full border border-white/12 bg-white/[0.03] px-7 py-3 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Run conformance
                </button>
              </div>
            </div>

            <div className="site-panel rounded-[38px] p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} selected`} className="h-16 w-16" />
                  <div>
                    <p className="font-mono text-sm text-[#9eb0b7]">Active rail</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">{selectedChain.name}</h2>
                  </div>
                </div>
                <span className="rounded-md border border-[#d4a93e]/20 bg-[#d4a93e]/10 px-4 py-2 font-mono text-sm font-bold text-[#f0d080]">
                  {stateLabel}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ['Network', selectedChain.network],
                  ['Primitive', selectedChain.primitive],
                  ['Finality', selectedChain.finality],
                  ['Integration surface', selectedChain.integrationSurface],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">{label}</p>
                    <p className="mt-3 text-lg font-bold leading-7 text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-24">
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {WORKFLOW_STEPS.map(([step, title, body]) => (
              <article key={step} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#d4a93e]">{step}</p>
                <h3 className="mt-4 text-xl font-black tracking-[-0.02em] text-white">{title}</h3>
                <p className="site-copy-sm mt-3">{body}</p>
              </article>
            ))}
          </div>

          <div className="site-panel rounded-[40px] p-8 md:p-10 lg:p-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-3xl">
                <p className="site-label">Rail selection</p>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                  Choose the environment your team wants to inspect.
                </h2>
                <p className="site-copy mt-5">
                  The same default-resolution workflow runs across every supported rail. The selector is intentionally prominent because the sandbox starts with the chain lane, not with a checklist.
                </p>
              </div>
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm text-[#d0dde0]">
                {CHAIN_ADAPTERS.length} testnet rails
              </span>
            </div>

            <div className="mt-10">
              <ChainSelector chains={CHAIN_ADAPTERS} selected={selectedChain} onSelect={setSelectedChain} />
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container py-24">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] px-6 py-5">
            <div>
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Session control plane</p>
              <p className="site-copy-sm mt-2">
                Current sandbox is pinned to <span className="font-bold text-white">{selectedChain.name}</span> for deterministic conformance review.
              </p>
            </div>
            <p className="rounded-md border border-white/10 bg-[#07131a]/55 px-4 py-2 font-mono text-sm text-[#d0dde0]">
              Session {sessionId}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-6">
              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">Project profile</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Sandbox configuration</h2>
                  </div>
                  <button
                    onClick={attachAdapter}
                    className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]"
                  >
                    Bind selected rail
                  </button>
                </div>

                <div className="mt-7 grid gap-4 lg:grid-cols-3">
                  {INTEGRATION_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className="rounded-[26px] border p-6 text-left transition"
                      style={{
                        borderColor: selectedProfile.id === profile.id ? '#d4a93e' : 'rgba(255,255,255,0.10)',
                        background: selectedProfile.id === profile.id ? 'rgba(212,169,62,0.12)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <p className="text-lg font-black tracking-[-0.02em] text-white">{profile.name}</p>
                      <p className="mt-2 text-sm leading-7 text-[#d0dde0]">{profile.value}</p>
                      <p className="mt-4 text-sm leading-7 text-[#9eb0b7]">{profile.integrationGoal}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="site-panel rounded-[34px] p-6 md:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">Evidence workflow</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Session activity</h2>
                  </div>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm text-[#d0dde0]">
                    {selectedChain.endpoint}
                  </span>
                </div>

                <div className="min-h-[240px] space-y-3 font-mono text-sm leading-7">
                  {consoleEvents.map((event, index) => (
                    <div key={`${event.time}-${index}`} className="grid grid-cols-[78px_1fr] gap-4">
                      <span className="text-[#9eb0b7]">{event.time}</span>
                      <span className={event.tone === 'success' ? 'text-[#00cc66]' : event.tone === 'warning' ? 'text-[#f0d080]' : 'text-[#d0dde0]'}>
                        {event.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-3">
                  {DEMO_EVENTS.map((event, index) => (
                    <div key={event} className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-[14px] font-mono text-sm font-bold"
                        style={{
                          background: activeEvent >= index ? '#00cc66' : 'rgba(255,255,255,0.07)',
                          color: activeEvent >= index ? '#07130d' : '#d0dde0',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm leading-7 text-[#d0dde0]">{event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="site-panel-muted rounded-[32px] p-6">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">API payload</p>
                  <pre className="mt-5 max-h-[420px] overflow-hidden whitespace-pre-wrap break-all rounded-[24px] border border-white/10 bg-[#07131a]/70 p-5 font-mono text-sm leading-7 text-[#d0dde0]">
                    <code>{payload}</code>
                  </pre>
                </div>

                <div className="site-panel-muted rounded-[32px] p-6">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Project integration</p>
                  <h3 className="mt-4 text-3xl font-black tracking-[-0.03em] text-white">{selectedProfile.name}</h3>
                  <p className="site-copy mt-4">{selectedProfile.integrationGoal}</p>

                  <div className="mt-6 grid gap-3">
                    {INTEGRATION_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => copyIntegrationAction(action.label, action.command)}
                        className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#d4a93e]/40 hover:bg-white/[0.06]"
                      >
                        <span className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-base font-black text-white">{action.label}</span>
                          <span className="rounded-md bg-[#07131a]/70 px-3 py-1 font-mono text-sm text-[#d4a93e]">
                            {integrationCopied === action.label ? 'Copied' : 'Copy'}
                          </span>
                        </span>
                        <span className="mt-3 block font-mono text-sm leading-7 text-[#d0dde0]">{action.command}</span>
                        <span className="mt-2 block text-sm leading-7 text-[#9eb0b7]">{action.body}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3">
                    {[
                      ['Sector', selectedProfile.sector],
                      ['Vault', selectedProfile.vault],
                      ['Claim', selectedProfile.claim],
                      ['Capacity', selectedProfile.value],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">{label}</p>
                        <p className="mt-3 text-base font-bold leading-7 text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="site-panel rounded-[34px] p-6 md:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#d4a93e]">Sandbox controls</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Session status</h2>
                  </div>
                  <span className="rounded-md border border-[#d4a93e]/20 bg-[#d4a93e]/10 px-4 py-2 font-mono text-sm text-[#f0d080]">
                    {stateLabel}
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  <button onClick={provisionWallet} className="rounded-full bg-[#f7f9f7] px-5 py-3.5 text-base font-bold text-[#07131a] transition hover:bg-white">
                    Create sandbox wallet
                  </button>
                  <button onClick={() => createPolicyArtifact()} className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3.5 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]">
                    Create Demo Policy NFT
                  </button>
                  <button onClick={attachAdapter} className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3.5 text-base font-bold text-[#f7f9f7] transition hover:bg-white/[0.06]">
                    Bind selected rail
                  </button>
                  <button
                    onClick={runConformance}
                    disabled={workspaceState === 'running'}
                    className="rounded-full bg-[#d4a93e] px-5 py-3.5 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Run conformance
                  </button>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">Sandbox wallet</p>
                  <p className="mt-3 break-words font-mono text-sm font-bold leading-7 text-white">
                    {walletAddress || 'Not provisioned'}
                  </p>
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">Demo policy artifact</p>
                  <p className="mt-3 break-words font-mono text-sm font-bold leading-7 text-white">
                    {policyId || `${selectedChain.policyArtifact} not created`}
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  {[
                    ['Selected rail', selectedChain.name],
                    ['Settlement model', 'Unsigned packet returned to institution'],
                    ['Evidence result', `${passedChecks.length}/9 checks completed`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">{label}</p>
                      <p className="mt-3 text-base font-bold leading-7 text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="site-panel-muted rounded-[34px] p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#d4a93e]">Conformance receipt</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Evidence gates</h2>
                  </div>
                  <span className="rounded-md border border-white/10 bg-[#07131a]/55 px-4 py-2 font-mono text-sm text-[#d0dde0]">
                    9 / 9
                  </span>
                </div>

                <div className="grid gap-3">
                  {CONFORMANCE_CHECKS.map((check) => {
                    const passed = passedChecks.includes(check.id);

                    return (
                      <div key={check.id} className="grid grid-cols-[42px_1fr] gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-[14px] font-mono text-sm font-bold"
                          style={{
                            background: passed ? '#00cc66' : 'rgba(255,255,255,0.08)',
                            color: passed ? '#07130d' : '#d0dde0',
                          }}
                        >
                          {passed ? 'OK' : check.id}
                        </span>
                        <div>
                          <p className="text-sm font-black leading-6 text-white">{check.label}</p>
                          <p className="mt-1 text-sm leading-6 text-[#d0dde0]">{check.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={copyReceipt}
                  disabled={workspaceState !== 'receipt-ready'}
                  className="mt-5 w-full rounded-full bg-[#d4a93e] px-5 py-3.5 text-base font-bold text-[#07131a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {receiptCopied ? 'Receipt copied' : 'Copy receipt'}
                </button>
              </div>

              <div className="site-panel rounded-[34px] p-6">
                <p className="font-mono text-sm font-bold text-[#d4a93e]">Receipt preview</p>
                <pre className="mt-5 overflow-hidden whitespace-pre-wrap break-all rounded-[24px] border border-white/10 bg-[#07131a]/70 p-5 font-mono text-sm leading-7 text-[#d0dde0]">
                  {receipt}
                </pre>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="live-playground" className="site-section">
        <div className="site-container py-24">
          <div className="mb-10 max-w-3xl">
            <p className="site-label">Live rail validation</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
              XRPL runs live Altnet wallet validation. Every other rail stays aligned to the same conformance model.
            </h2>
          </div>

          {selectedChain.id === 'xrpl' ? (
            <div className="site-panel rounded-[38px] p-6 text-[#f7f9f7] md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">XRPL Altnet wallet connect</p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white">Run against Ward policy NFTs</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedChain.walletActions.map((action) => (
                      <a
                        key={action.href}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-[#d0dde0] transition hover:bg-white/[0.07] hover:text-white"
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                </div>
                <WalletConnector />
              </div>
              <LiveValidator />
            </div>
          ) : (
            <div className="site-panel-muted rounded-[38px] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <ChainLogo id={selectedChain.logo} label={`${selectedChain.name} rail`} className="h-16 w-16" />
                  <div>
                    <p className="font-mono text-sm text-[#d4a93e]">{selectedChain.status}</p>
                    <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">{selectedChain.name} rail path</h3>
                  </div>
                </div>
                <p className="site-copy max-w-2xl">
                  Use the chain wallet, faucet, and explorer path to inspect the deployed or funded testnet artifact. Ward maps that evidence into the same nine-check conformance receipt without holding keys or signing settlement actions.
                </p>
              </div>

              <div className="mt-7 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="font-mono text-sm font-bold text-[#d4a93e]">Policy artifact</p>
                  <p className="mt-3 text-lg font-black text-white">{selectedChain.policyArtifact}</p>
                  <p className="mt-3 break-words font-mono text-sm leading-7 text-[#d0dde0]">{selectedChain.deploymentRef}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedChain.walletActions.map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-base font-bold text-[#f7f9f7] transition hover:border-[#d4a93e]/40 hover:bg-white/[0.06]"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
