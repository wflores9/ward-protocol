'use client';

import { useState } from 'react';

type Chain = { id: string; name: string };

export default function EnhancedWardChecklist({ chain }: { chain: Chain }) {
  const [checks, setChecks] = useState([
    { id: 1, label: "Policy NFT Verified", passed: true },
    { id: 2, label: "Policy Not Expired", passed: true },
    { id: 3, label: "Vault Address Match", passed: true },
    { id: 4, label: "Default Flag Confirmed", passed: true },
    { id: 5, label: "Vault Loss > Zero", passed: true },
    { id: 6, label: "Pool Coverage Available", passed: true },
    { id: 7, label: "NFT Still Live", passed: true },
    { id: 8, label: "Claimant Holds NFT", passed: true },
    { id: 9, label: "Pool Solvent", passed: false },
  ]);

  const allPassed = checks.every(c => c.passed);

  const toggleCheck = (id: number) => {
    setChecks(checks.map(c => c.id === id ? { ...c, passed: !c.passed } : c));
  };

  return (
    <div className="bg-[#0F172A] rounded-3xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-semibold">9 On-Ledger Checks — {chain.name}</h3>
        <div className={`px-4 py-1.5 rounded-full text-sm font-mono ${allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {allPassed ? '✅ CONFORMANT' : '⚠️ REVIEW REQUIRED'}
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <button
            key={check.id}
            onClick={() => toggleCheck(check.id)}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${
              check.passed 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${check.passed ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>
              {check.passed ? '✓' : '○'}
            </div>
            <span className="text-lg">{check.label}</span>
          </button>
        ))}
      </div>

      {allPassed && (
        <div className="mt-10 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
          <p className="text-emerald-400 text-xl">All 9 checks passed! This integration is conformant.</p>
        </div>
      )}
    </div>
  );
}