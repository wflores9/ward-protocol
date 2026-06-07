'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

import ChainSelector from '@/components/ChainSelector';
import EnhancedWardChecklist from '@/components/EnhancedWardChecklist';
import FlowRunner from '@/components/FlowRunner';

const WalletConnector = dynamic(() => import('@/components/WalletConnector'), { ssr: false });
const LiveValidator = dynamic(() => import('@/components/LiveValidator'), { ssr: false });

const chains = [
  { id: 'xrpl', name: 'XRPL Altnet', icon: '🌊', status: 'Live' },
  { id: 'stellar', name: 'Stellar Testnet', icon: '⭐', status: 'Live' },
  { id: 'hedera', name: 'Hedera Testnet', icon: 'HBAR', status: 'Live' },
  { id: 'solana', name: 'Solana Devnet', icon: '◎', status: 'Live' },
  { id: 'xdc', name: 'XDC Apothem', icon: 'XDC', status: 'Live' },
  { id: 'algorand', name: 'Algorand Testnet', icon: 'Algo', status: 'Live' },
  { id: 'polygon', name: 'Polygon Amoy', icon: 'MATIC', status: 'Live' },
];

export default function DemoPage() {
  const [selectedChain, setSelectedChain] = useState(chains[0]);

  return (
    <div className="min-h-screen bg-[#0A1428] text-white">
      <div className="border-b border-white/10 bg-[#0F172A] py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="text-sm uppercase tracking-widest text-[#D4A017] mb-3">Interactive Demo</div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
            Deterministic Default Resolution
          </h1>
          <p className="text-xl text-[#CBD5E1] max-w-2xl mx-auto">
            Try the 9 on-ledger checks live across multiple testnets.
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-[#0A1428]/95 backdrop-blur border-b border-white/10 py-4">
        <div className="max-w-5xl mx-auto px-6">
          <ChainSelector 
            chains={chains} 
            selected={selectedChain} 
            onSelect={setSelectedChain} 
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">
        <div>
          <WalletConnector />
          <LiveValidator />
        </div>

        <section>
          <h2 className="text-3xl font-semibold mb-8">9 On-Ledger Checks — Real-Time Simulation</h2>
          <EnhancedWardChecklist chain={selectedChain} />
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-6">Integration Flow (F·01 → F·06)</h2>
          <FlowRunner />
        </section>
      </div>
    </div>
  );
}
