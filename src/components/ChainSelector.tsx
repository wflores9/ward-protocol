'use client';

import ChainLogo from '@/components/ChainLogo';
import type { ChainAdapter } from '@/lib/wardPlatform';

interface ChainSelectorProps {
  chains: ChainAdapter[];
  selected: ChainAdapter;
  onSelect: (chain: ChainAdapter) => void;
}

export default function ChainSelector({ chains, selected, onSelect }: ChainSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {chains.map((chain) => {
        const isSelected = selected.id === chain.id;

        return (
          <button
            key={chain.id}
            onClick={() => onSelect(chain)}
            aria-pressed={isSelected}
            className="min-h-[196px] rounded-xl border p-5 text-left transition duration-150 hover:-translate-y-0.5 md:p-6"
            style={{
              borderColor: isSelected ? chain.accent : 'rgba(167,197,229,0.35)',
              background: isSelected
                ? `linear-gradient(180deg, ${chain.accentSoft}, rgba(255,255,255,0.95))`
                : '#ffffff',
              boxShadow: isSelected
                ? `0 0 0 3px ${chain.accentSoft}, 0 1px 3px rgba(15,36,57,0.06)`
                : '0 1px 3px rgba(15,36,57,0.06)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-12 w-12" />
              <span
                className="rounded-md border px-3 py-1.5 font-mono text-sm font-bold text-[#5a7a99]"
                style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#f0f4f8' }}
              >
                {chain.status}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xl font-semibold tracking-[-0.02em] text-[#0f2439]">{chain.name}</p>
              <p className="mt-2 text-sm font-medium text-[#5a7a99]">{chain.network}</p>
              <p className="mt-4 text-sm leading-6 text-[#8aafc8]">{chain.proof}</p>
            </div>

            <div className="mt-5 grid gap-2">
              <span
                className="break-words rounded-md border px-3 py-2 font-mono text-sm text-[#5a7a99]"
                style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f0f4f8' }}
              >
                {chain.integrationSurface}
              </span>
              <span
                className="break-words rounded-md border px-3 py-2 font-mono text-sm text-[#5a7a99]"
                style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f0f4f8' }}
              >
                {chain.deploymentRef}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
