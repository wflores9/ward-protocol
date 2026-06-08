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
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
      {chains.map((chain) => {
        const isSelected = selected.id === chain.id;

        return (
          <button
            key={chain.id}
            onClick={() => onSelect(chain)}
            aria-pressed={isSelected}
            className="min-w-[250px] snap-start rounded-[24px] border p-5 text-left transition duration-150 hover:-translate-y-0.5 md:min-w-0"
            style={{
              borderColor: isSelected ? chain.accent : 'rgba(255,255,255,0.10)',
              background: isSelected
                ? `linear-gradient(180deg, ${chain.accentSoft}, rgba(255,255,255,0.045))`
                : 'rgba(255,255,255,0.035)',
              boxShadow: isSelected ? `0 0 0 3px ${chain.accentSoft}` : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-12 w-12" />
              <span className="rounded-full border border-white/10 bg-[#07131a]/70 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d0dde0]">
                {chain.status}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-lg font-black text-white">{chain.name}</p>
              <p className="mt-1 text-sm font-medium text-[#d0dde0]">{chain.network}</p>
              <p className="mt-3 text-sm leading-6 text-[#9eb0b7]">{chain.proof}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-[#07131a]/55 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9eb0b7]">
                {chain.integrationSurface}
              </span>
              <span className="rounded-full border border-white/10 bg-[#07131a]/55 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9eb0b7]">
                {chain.recentRuns} recent runs
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
