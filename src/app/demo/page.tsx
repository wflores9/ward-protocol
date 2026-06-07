'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

import ChainSelector from '@/components/ChainSelector';
import EnhancedWardChecklist from '@/components/EnhancedWardChecklist';
import FlowRunner from '@/components/FlowRunner';

const WalletConnector = dynamic(() => import('@/components/WalletConnector'), { ssr: false });
const LiveValidator = dynamic(() => import('@/components/LiveValidator'), { ssr: false });

export const metadata: Metadata = {
  title: 'Ward Protocol — Interactive Multi-Chain Demo',
  description: 'Experience deterministic default resolution live across XRPL, Stellar, Solana, Hedera, and more.',
};

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
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0F172A] py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="text-sm uppercase tracking-widest text-[#D4A017] mb-3">Interactive Demo</div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
            Try Ward Protocol Live
          </h1>
          <p className="text-xl text-[#CBD5E1] max-w-2xl mx-auto">
            Simulate deterministic default resolution across {chains.length} testnets.<br />
            See exactly how the 9 on-ledger checks work before going to mainnet.
          </p>
        </div>
      </div>

      {/* Chain Selector */}
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
        {/* Live Wallet + Validator */}
        <div>
          <WalletConnector chain={selectedChain} />
          <LiveValidator chain={selectedChain} />
        </div>

        {/* Enhanced Interactive Checklist */}
        <section>
          <h2 className="text-3xl font-semibold mb-8">9 On-Ledger Checks — Real-Time Simulation</h2>
          <EnhancedWardChecklist chain={selectedChain} />
        </section>

        {/* Visual Flow */}
        <section>
          <h2 className="text-3xl font-semibold mb-6">Integration Flow (F·01 → F·06)</h2>
          <FlowRunner chain={selectedChain} />
        </section>

        {/* Next Steps */}
        <div className="bg-[#0F172A] rounded-3xl p-10 text-center">
          <h3 className="text-2xl font-semibold mb-4">Ready to Integrate?</h3>
          <p className="text-[#CBD5E1] mb-8 max-w-md mx-auto">
            The demo above uses real testnet logic. Everything you see here can be replicated in your application.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/docs" className="px-8 py-3.5 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition">
              View Full Documentation
            </a>
            <a href="https://github.com/wflores9/ward-protocol" className="px-8 py-3.5 border border-white/30 rounded-xl hover:bg-white/5 transition">
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}