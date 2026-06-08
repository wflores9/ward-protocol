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
    <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
      {chains.map((chain) => {
        const isSelected = selected.id === chain.id;

        return (
          <button
            key={chain.id}
            onClick={() => onSelect(chain)}
            aria-pressed={isSelected}
            className="min-h-[232px] min-w-[300px] snap-start rounded-[28px] border p-6 text-left transition duration-150 hover:-translate-y-0.5 md:min-w-0 md:p-7"
            style={{
              borderColor: isSelected ? chain.accent : 'rgba(255,255,255,0.10)',
              background: isSelected
                ? `linear-gradient(180deg, ${chain.accentSoft}, rgba(255,255,255,0.05))`
                : 'rgba(255,255,255,0.028)',
              boxShadow: isSelected ? `0 0 0 3px ${chain.accentSoft}` : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-14 w-14" />
              <span className="rounded-full border border-white/10 bg-[#07131a]/70 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#d0dde0]">
                {chain.status}
              </span>
            </div>

            <div className="mt-7">
              <p className="text-xl font-black tracking-[-0.03em] text-white">{chain.name}</p>
              <p className="mt-2 text-sm font-medium text-[#d0dde0]">{chain.network}</p>
              <p className="mt-5 text-sm leading-7 text-[#9eb0b7]">{chain.proof}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-[#07131a]/55 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9eb0b7]">
                {chain.integrationSurface}
              </span>
              <span className="rounded-full border border-white/10 bg-[#07131a]/55 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9eb0b7]">
                {chain.recentRuns} recent runs
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
