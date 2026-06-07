'use client';

type Chain = {
  id: string;
  name: string;
  icon: string;
  status: string;
};

interface ChainSelectorProps {
  chains: Chain[];
  selected: Chain;
  onSelect: (chain: Chain) => void;
}

export default function ChainSelector({ chains, selected, onSelect }: ChainSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onSelect(chain)}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${
            selected.id === chain.id
              ? 'border-[#93C5FD] bg-[#93C5FD]/10 text-white'
              : 'border-white/10 hover:border-white/30 text-[#CBD5E1]'
          }`}
        >
          <span className="text-2xl">{chain.icon}</span>
          <div className="text-left">
            <div className="font-medium">{chain.name}</div>
            <div className="text-xs text-[#64748B]">{chain.status}</div>
          </div>
        </button>
      ))}
    </div>
  );
}