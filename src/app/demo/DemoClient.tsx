'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const WalletConnector = dynamic(() => import('@/components/WalletConnector'), { ssr: false });
const LiveValidator = dynamic(() => import('@/components/LiveValidator'), { ssr: false });

type ChainId = 'xrpl' | 'stellar' | 'hedera' | 'solana' | 'xdc' | 'algorand' | 'polygon';
type RunState = 'idle' | 'running' | 'complete';

type Chain = {
  id: ChainId;
  mark: string;
  name: string;
  network: string;
  status: string;
  availability: string;
  wallet: string;
  primitive: string;
  primitiveRef: string;
  endpoint: string;
  validators: string;
  recentRuns: string;
  accent: string;
  accentSoft: string;
};

const CHAINS: Chain[] = [
  {
    id: 'xrpl',
    mark: 'XRP',
    name: 'XRPL Altnet',
    network: 'XLS-66 lending vaults',
    status: 'Live',
    availability: 'Wallet + ledger validation',
    wallet: 'Xaman, Crossmark, GemWallet',
    primitive: 'NFToken policy + vault ledger state',
    primitiveRef: 'NFTokenTaxon=281',
    endpoint: '/claims/file',
    validators: '3-ledger confirm',
    recentRuns: '317',
    accent: '#9fc6ff',
    accentSoft: 'rgba(159,198,255,0.16)',
  },
  {
    id: 'stellar',
    mark: 'STR',
    name: 'Stellar',
    network: 'Testnet lending vaults',
    status: 'Testnet-ready',
    availability: 'Freighter adapter track',
    wallet: 'Freighter, WalletConnect',
    primitive: 'Soroban contract state + claimant balance',
    primitiveRef: 'contract_data:ward_policy',
    endpoint: '/conformance/stellar/run',
    validators: 'finalized ledger read',
    recentRuns: '142',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125,211,252,0.16)',
  },
  {
    id: 'hedera',
    mark: 'HBAR',
    name: 'Hedera',
    network: 'HBAR testnet',
    status: 'Testnet-ready',
    availability: 'HashPack adapter track',
    wallet: 'HashPack, Blade',
    primitive: 'HTS policy serial + mirror-node vault state',
    primitiveRef: 'token_serial:ward_policy',
    endpoint: '/conformance/hedera/run',
    validators: 'mirror-node consensus',
    recentRuns: '118',
    accent: '#a7f3d0',
    accentSoft: 'rgba(167,243,208,0.16)',
  },
  {
    id: 'solana',
    mark: 'SOL',
    name: 'Solana',
    network: 'Devnet',
    status: 'Testnet-ready',
    availability: 'Phantom adapter track',
    wallet: 'Phantom, Backpack',
    primitive: 'SPL token account + program vault state',
    primitiveRef: 'metadata.mint:ward_policy',
    endpoint: '/conformance/solana/run',
    validators: 'confirmed slot read',
    recentRuns: '201',
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.18)',
  },
  {
    id: 'xdc',
    mark: 'XDC',
    name: 'XDC',
    network: 'Apothem',
    status: 'Testnet-ready',
    availability: 'EVM adapter track',
    wallet: 'MetaMask, XDC Pay',
    primitive: 'ERC policy token + vault contract state',
    primitiveRef: 'wardPolicyToken.ownerOf',
    endpoint: '/conformance/xdc/run',
    validators: 'block finality window',
    recentRuns: '96',
    accent: '#fcd34d',
    accentSoft: 'rgba(252,211,77,0.16)',
  },
  {
    id: 'algorand',
    mark: 'ALGO',
    name: 'Algorand',
    network: 'Testnet',
    status: 'Testnet-ready',
    availability: 'Pera adapter track',
    wallet: 'Pera, Defly',
    primitive: 'ASA policy asset + application local state',
    primitiveRef: 'asa_id:ward_policy',
    endpoint: '/conformance/algorand/run',
    validators: 'round finality read',
    recentRuns: '134',
    accent: '#86efac',
    accentSoft: 'rgba(134,239,172,0.16)',
  },
  {
    id: 'polygon',
    mark: 'POL',
    name: 'Polygon',
    network: 'Amoy',
    status: 'Testnet-ready',
    availability: 'EVM adapter track',
    wallet: 'MetaMask, WalletConnect',
    primitive: 'ERC policy token + pool contract state',
    primitiveRef: 'wardPolicy.balanceOf',
    endpoint: '/conformance/polygon/run',
    validators: 'block confirmation read',
    recentRuns: '176',
    accent: '#d8b4fe',
    accentSoft: 'rgba(216,180,254,0.16)',
  },
];

const CHECKS = [
  {
    id: '01',
    label: 'Policy artifact is on ledger',
    detail: (chain: Chain) => `${chain.primitiveRef} resolves before claim validation starts.`,
  },
  {
    id: '02',
    label: 'Policy window is active',
    detail: (chain: Chain) => `Coverage dates are read from ${chain.network}.`,
  },
  {
    id: '03',
    label: 'Vault binding matches claimant',
    detail: (chain: Chain) => `Claimant, vault, and policy references agree on ${chain.name}.`,
  },
  {
    id: '04',
    label: 'Verified default is confirmed',
    detail: (chain: Chain) => `${chain.validators} protects the default signal from a transient read.`,
  },
  {
    id: '05',
    label: 'Vault loss is greater than zero',
    detail: () => 'Loss math is bounded before any payout route is built.',
  },
  {
    id: '06',
    label: 'Pool coverage is available',
    detail: () => 'Coverage cannot exceed the pool balance or the policy cap.',
  },
  {
    id: '07',
    label: 'Policy is still live',
    detail: (chain: Chain) => `${chain.primitive} has not been burned, closed, or invalidated.`,
  },
  {
    id: '08',
    label: 'Claimant owns the policy',
    detail: (chain: Chain) => `Wallet ownership is checked through ${chain.wallet}.`,
  },
  {
    id: '09',
    label: 'Settlement remains unsigned by Ward',
    detail: () => 'ward_signed = False. Ward prepares state, the institution signs.',
  },
];

const FLOW_STEPS = [
  {
    id: 'F01',
    title: 'Vault registration',
    body: 'Institution registers a vault and signs the chain-native transaction.',
  },
  {
    id: 'F02',
    title: 'Policy purchase',
    body: 'A policy artifact is minted or registered without transfer loopholes.',
  },
  {
    id: 'F03',
    title: 'Default monitor',
    body: 'Ward watches the ledger until the default is confirmed.',
  },
  {
    id: 'F04',
    title: 'Claim validation',
    body: 'The 9 checks read on-ledger state and return approve or reject.',
  },
  {
    id: 'F05',
    title: 'Escrow settlement',
    body: 'The pool signs settlement and the claimant finishes with their preimage.',
  },
  {
    id: 'F06',
    title: 'Conformance receipt',
    body: 'The app stores a shareable result showing chain, checks, and signer boundary.',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function chainCode(chain: Chain) {
  return [
    'from ward import WardClient',
    '',
    `client = WardClient(chain="${chain.id}", network="${chain.network}")`,
    '',
    'result = await client.run_conformance_test(',
    `    policy_ref="${chain.primitiveRef}",`,
    '    claimant_address=wallet.address,',
    '    vault_id=vault.id,',
    '    condition_hex=condition_hex,',
    ')',
    '',
    'assert result.steps_passed == 9',
    'assert result.ward_signed is False',
    'assert result.signer_boundary == "institution"',
  ].join('\n');
}

export default function DemoClient() {
  const [selectedChain, setSelectedChain] = useState<Chain>(CHAINS[0]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [passedChecks, setPassedChecks] = useState<string[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  const allPassed = passedChecks.length === CHECKS.length;
  const progress = Math.round((passedChecks.length / CHECKS.length) * 100);
  const currentCode = useMemo(() => chainCode(selectedChain), [selectedChain]);

  useEffect(() => {
    setRunState('idle');
    setActiveStep(-1);
    setPassedChecks([]);
    setShareCopied(false);
  }, [selectedChain.id]);

  const runSimulation = async () => {
    if (runState === 'running') return;

    setRunState('running');
    setActiveStep(-1);
    setPassedChecks([]);
    setShareCopied(false);

    for (let i = 0; i < CHECKS.length; i += 1) {
      await delay(260);
      setActiveStep(i);
      setPassedChecks((current) => [...current, CHECKS[i].id]);
    }

    await delay(180);
    setRunState('complete');
  };

  const resetSimulation = () => {
    setRunState('idle');
    setActiveStep(-1);
    setPassedChecks([]);
    setShareCopied(false);
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/demo?chain=${selectedChain.id}&result=conformant`;
    await navigator.clipboard.writeText(link);
    setShareCopied(true);
  };

  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] text-[#f7faf8]">
        <img
          src="/brand/ward-banner.png"
          alt="Ward Protocol deterministic resolution banner"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[#14242b]/75" />
        <div className="absolute inset-0 grid-overlay opacity-70" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <img
                src="/brand/ward-core.png"
                alt="Ward Protocol mark"
                className="h-16 w-16 rounded-full border border-[#b6d7ce]/30"
              />
              <div>
                <p className="font-mono text-sm text-[#d4a93e]">Interactive Demo</p>
                <p className="text-base text-[#d2e1dd]">Multi-chain deterministic default resolution</p>
              </div>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#f7faf8] md:text-5xl lg:text-6xl">
              Run Ward's 9 on-ledger checks across every integration lane.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
              Select a chain, simulate a full claim, inspect the signer boundary, and move from XRPL Altnet into Stellar, Hedera, Solana, XDC, Algorand, and Polygon testnet demos.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={runSimulation}
                disabled={runState === 'running'}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {runState === 'running' ? 'Running claim validation' : 'Simulate full claim'}
              </button>
              <a
                href="#live-playground"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10"
              >
                Open live testnet
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#0f1f25]/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-[#d4a93e]">Selected chain</p>
                  <h2 className="mt-1 text-2xl font-black text-[#f7faf8]">{selectedChain.name}</h2>
                </div>
                <span
                  className="rounded-md border px-3 py-1.5 font-mono text-sm font-bold"
                  style={{ borderColor: selectedChain.accent, color: selectedChain.accent }}
                >
                  {selectedChain.status}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Network', selectedChain.network],
                  ['Primitive', selectedChain.primitive],
                  ['Signer boundary', 'Institution signs'],
                  ['Ward signature', 'False, always'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-4">
                    <p className="font-mono text-sm text-[#a9bdb8]">{label}</p>
                    <p className="mt-2 text-base font-bold leading-6 text-[#f7faf8]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#b6d7ce]/20 bg-[#0f1f25]">
              <img
                src="/brand/ward-invariant.jpg"
                alt="ward_signed equals false invariant"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 border-b border-[#14242b]/10 bg-[#f6f4ee]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 md:px-10 lg:px-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-bold text-[#14242b]">Chain selector</p>
            <p className="font-mono text-sm text-[#52665f]">Run target: {selectedChain.endpoint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {CHAINS.map((chain) => {
              const isSelected = selectedChain.id === chain.id;
              return (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain)}
                  className="min-h-[118px] rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(20,36,43,0.12)]"
                  style={{
                    borderColor: isSelected ? chain.accent : 'rgba(20,36,43,0.14)',
                    boxShadow: isSelected ? `0 0 0 3px ${chain.accentSoft}` : undefined,
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-md font-mono text-sm font-bold text-[#14242b]"
                      style={{ backgroundColor: chain.accentSoft, border: `1px solid ${chain.accent}` }}
                    >
                      {chain.mark}
                    </span>
                    <span
                      className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] px-2 py-1 font-mono text-sm font-bold text-[#3f534d]"
                      style={isSelected ? { borderColor: chain.accent, backgroundColor: chain.accentSoft } : undefined}
                    >
                      {chain.status}
                    </span>
                  </div>
                  <p className="text-base font-black leading-5 text-[#14242b]">{chain.name}</p>
                  <p className="mt-1 text-sm leading-5 text-[#52665f]">{chain.availability}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#14242b]/10 bg-[#f6f4ee] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Interactive 9-check simulator</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-4xl">
              A claim only passes when every chain primitive agrees.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              The demo walks through the exact conformance gates Ward needs before settlement can proceed. Toggle the chain above and the primitive, wallet lane, endpoint, and code all update together.
            </p>

            <div className="mt-8 rounded-lg border border-[#14242b]/10 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-[#52665f]">Conformance progress</p>
                  <p className="mt-1 text-2xl font-black text-[#14242b]">{progress}% complete</p>
                </div>
                <div className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] px-4 py-2 font-mono text-sm font-bold text-[#14242b]">
                  {passedChecks.length} / {CHECKS.length} checks
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-md bg-[#e6e2d8]">
                <div
                  className="h-full rounded-md transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: allPassed ? '#00cc66' : selectedChain.accent }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={runSimulation}
                  disabled={runState === 'running'}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#14242b] px-5 py-3 text-base font-bold text-white transition hover:bg-[#1d3035] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runState === 'running' ? 'Running conformance test' : 'Run conformance test'}
                </button>
                <button
                  onClick={resetSimulation}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#14242b]/20 px-5 py-3 text-base font-bold text-[#14242b] transition hover:border-[#14242b]/40 hover:bg-[#14242b]/5"
                >
                  Reset
                </button>
                {allPassed && (
                  <button
                    onClick={copyShareLink}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#00cc66]/40 bg-[#00cc66]/10 px-5 py-3 text-base font-bold text-[#116c3b] transition hover:bg-[#00cc66]/20"
                  >
                    {shareCopied ? 'Share link copied' : 'Copy shareable result'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {CHECKS.map((check, index) => {
              const passed = passedChecks.includes(check.id);
              const active = activeStep === index && runState === 'running';
              return (
                <div
                  key={check.id}
                  className="grid grid-cols-[48px_1fr] gap-4 rounded-lg border bg-white p-4 transition"
                  style={{
                    borderColor: passed ? '#00cc66' : active ? selectedChain.accent : 'rgba(20,36,43,0.12)',
                    background: passed ? 'rgba(0,204,102,0.07)' : active ? selectedChain.accentSoft : '#ffffff',
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md border font-mono text-sm font-bold"
                    style={{
                      borderColor: passed || active ? selectedChain.accent : 'rgba(20,36,43,0.16)',
                      backgroundColor: passed ? '#00cc66' : '#f6f4ee',
                      color: passed ? '#07130d' : '#14242b',
                    }}
                  >
                    {passed ? 'OK' : check.id}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-6 text-[#14242b]">{check.label}</h3>
                    <p className="mt-1 text-base leading-7 text-[#52665f]">{check.detail(selectedChain)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {allPassed && (
          <div className="mx-auto mt-8 max-w-7xl px-6 md:px-10 lg:px-12">
            <div className="rounded-lg border border-[#00cc66]/30 bg-[#e8fff2] p-5 text-[#123c26]">
              <p className="font-mono text-sm font-bold">CONFORMANT - READY FOR PRODUCTION REVIEW</p>
              <p className="mt-2 text-lg font-bold">
                {selectedChain.name} passed all 9 checks. ward_signed = False and the signer boundary stayed with the institution.
              </p>
            </div>
          </div>
        )}
      </section>

      <section id="live-playground" className="border-b border-[#b6d7ce]/10 bg-[#14242b] py-14 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Live testnet playground</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                Wallet lane and validator status for {selectedChain.name}.
              </h2>
            </div>
            <span className="rounded-md border border-[#b6d7ce]/20 px-4 py-2 font-mono text-sm text-[#d2e1dd]">
              {selectedChain.wallet}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
              <p className="font-mono text-sm text-[#a9bdb8]">Adapter lane</p>
              <h3 className="mt-2 text-xl font-black text-[#f7faf8]">{selectedChain.wallet}</h3>
              <p className="mt-3 text-base leading-7 text-[#d2e1dd]">{selectedChain.availability}</p>
            </div>
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
              <p className="font-mono text-sm text-[#a9bdb8]">Conformance endpoint</p>
              <h3 className="mt-2 text-xl font-black text-[#f7faf8]">{selectedChain.endpoint}</h3>
              <p className="mt-3 text-base leading-7 text-[#d2e1dd]">{selectedChain.validators}</p>
            </div>
            <div className="rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
              <p className="font-mono text-sm text-[#a9bdb8]">Recent demo tests</p>
              <h3 className="mt-2 text-3xl font-black text-[#f7faf8]">{selectedChain.recentRuns}</h3>
              <p className="mt-3 text-base leading-7 text-[#d2e1dd]">Conformance test count shown for the demo network lane.</p>
            </div>
          </div>

          {selectedChain.id === 'xrpl' ? (
            <div className="mt-6 rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8] p-5 text-[#14242b]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-bold text-[#9b6d13]">XRPL Altnet wallet connect</p>
                  <h3 className="mt-2 text-2xl font-black">Run against live Ward policy NFTs</h3>
                </div>
                <WalletConnector />
              </div>
              <LiveValidator />
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-[#d4a93e]">{selectedChain.status}</p>
                  <h3 className="mt-2 text-2xl font-black text-[#f7faf8]">{selectedChain.name} adapter track</h3>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-[#d2e1dd]">
                    The simulator above uses the same conformance gates while the wallet adapter lane is prepared for {selectedChain.wallet}.
                  </p>
                </div>
                <button
                  onClick={runSimulation}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#f7faf8] px-5 py-3 text-base font-bold text-[#14242b] transition hover:bg-white"
                >
                  Run {selectedChain.mark} demo
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[#14242b]/10 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-8 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Flow simulator</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-4xl">
              F01 through F06 shows exactly where Ward sits.
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-6">
            {FLOW_STEPS.map((step, index) => (
              <div key={step.id} className="rounded-lg border border-[#14242b]/10 bg-[#f6f4ee] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-[#9b6d13]">{step.id}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#14242b] font-mono text-sm font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-black leading-6 text-[#14242b]">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#52665f]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#14242b]/10 bg-[#f6f4ee] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-12">
          <div>
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Integration example</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-4xl">
              Chain-specific primitive in, single Ward result out.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#3f534d]">
              The code path changes the ledger adapter, not the risk policy. That is the product story: one deterministic claims contract across multiple settlement rails.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['Primitive', selectedChain.primitiveRef],
                ['Wallets', selectedChain.wallet],
                ['Endpoint', selectedChain.endpoint],
                ['Boundary', 'ward_signed = False'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#14242b]/10 bg-white p-4">
                  <p className="font-mono text-sm text-[#52665f]">{label}</p>
                  <p className="mt-2 text-base font-black leading-6 text-[#14242b]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <pre className="min-h-[420px] overflow-x-auto rounded-lg border border-[#14242b]/20 bg-[#101d23] p-5 font-mono text-sm leading-7 text-[#d2e1dd]">
            <code>{currentCode}</code>
          </pre>
        </div>
      </section>

      <section className="bg-[#14242b] py-14 text-[#f7faf8]">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="font-mono text-sm font-bold text-[#d4a93e]">Multi-chain roadmap</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                Ward moves from proof to pilot without changing the invariant.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#d2e1dd]">
                Every chain lane keeps the same center: no oracle override, no Ward signature, no hidden payout discretion.
              </p>
            </div>
            <div className="grid gap-3">
              {CHAINS.map((chain) => (
                <div key={chain.id} className="grid grid-cols-[72px_1fr_auto] items-center gap-4 rounded-lg border border-[#b6d7ce]/20 bg-[#f7faf8]/10 p-4">
                  <span className="font-mono text-sm font-bold" style={{ color: chain.accent }}>
                    {chain.mark}
                  </span>
                  <div>
                    <p className="text-base font-black text-[#f7faf8]">{chain.name}</p>
                    <p className="text-sm leading-5 text-[#a9bdb8]">{chain.network}</p>
                  </div>
                  <span className="rounded-md border border-[#b6d7ce]/20 px-3 py-1.5 font-mono text-sm text-[#d2e1dd]">
                    {chain.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="/docs"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white"
            >
              View documentation
            </a>
            <a
              href="https://github.com/wflores9/ward-protocol"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10"
            >
              GitHub repository
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
