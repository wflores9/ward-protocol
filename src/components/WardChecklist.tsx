'use client'

import { useState } from 'react'

const STEPS = [
  { n: 1, name: 'NFT Existence & Taxon', desc: 'Policy NFT in claimant wallet with taxon = 281 (WARD_POLICY_TAXON)',
    detail: 'Ward calls AccountNFTs on the claimant address and verifies at least one NFT exists with NFTokenTaxon = 281. This taxon is the WARD_POLICY_TAXON constant "” any NFT with a different taxon is rejected regardless of other attributes.' },
  { n: 2, name: 'Policy Expiry', desc: 'Expiry checked against XRPL ledger close_time "” not server clock',
    detail: 'The policy expiry timestamp encoded in the NFT URI is compared against the current ledger close_time from a validated ledger. Server clocks are never trusted. This prevents expiry manipulation through clock skew or timezone attacks.' },
  { n: 3, name: 'Vault Address Binding', desc: 'NFT metadata vault address matches reported defaulted_vault',
    detail: 'The NFT URI metadata contains the vault address the policy was issued for. Ward decodes this and checks it exactly matches the defaulted_vault parameter in the claim. A policy issued for vault A cannot be used to claim against vault B.' },
  { n: 4, name: 'On-Chain Default Flag', desc: 'LedgerEntry carries LSF_LOAN_DEFAULT (0x00010000)',
    detail: 'Ward fetches the LedgerEntry for the reported loan and checks that the LSF_LOAN_DEFAULT flag (0x00010000) is set. This flag is set by the XLS-66 vault contract upon confirmed default "” it cannot be set off-chain.' },
  { n: 5, name: 'Positive Vault Loss', desc: 'TotalValueOutstanding from defaulted loan > 0 drops',
    detail: 'Ward reads TotalValueOutstanding from the defaulted loan LedgerEntry and confirms it is greater than zero. A zero-loss default produces no payout. This prevents claims on loans that were fully repaid before the flag was cleared.' },
  { n: 6, name: 'Pool Coverage Breach', desc: 'Usable pool balance = balance − XRPL reserve ≥ 0',
    detail: 'Ward calculates usable pool balance as the raw XRP balance minus the XRPL base reserve (currently 10 XRP). The reserve is non-spendable on the XRPL ledger. Only the usable portion is eligible for claim payout.' },
  { n: 7, name: 'Replay Protection', desc: 'NFT still live on-chain; burn-on-settlement prevents replays',
    detail: 'Ward confirms the policy NFT is still present in the claimant wallet at claim time. Upon successful settlement the NFT is burned via NFTokenBurn. A burned token cannot be replayed "” the same loss event cannot be claimed twice.' },
  { n: 8, name: 'Claimant Holds NFT', desc: 'NFT found in claimant_address wallet via AccountNFTs',
    detail: 'Ward calls AccountNFTs on the claimant_address and verifies the specific NFTokenID is present. The NFT must be in the claimant wallet "” not escrowed, not in another account. This binds the claim to the actual policy holder.' },
  { n: 9, name: 'Pool Solvency & Rate Limit', desc: 'Usable ≥ payout, ratio ≥ 1.5×, ≤ 3 claims/NFT per 300 s',
    detail: 'Three final checks: (1) usable pool balance must cover the full payout amount, (2) post-payout pool ratio must remain ≥ 1.5× to prevent pool insolvency, (3) no more than 3 claims per NFT within any 300-second window to prevent automated draining attacks.' },
]

const CIRCUMFERENCE = 2 * Math.PI * 32

export default function WardChecklist() {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [open, setOpen]       = useState<Set<number>>(new Set())

  const toggle = (n: number) =>
    setChecked(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s })

  const toggleOpen = (n: number) =>
    setOpen(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s })

  const count = checked.size
  const pct   = count / STEPS.length
  const offset = CIRCUMFERENCE * (1 - pct)
  const ringColor = count === 9 ? '#00cc66' : count >= 5 ? '#c8a94a' : '#6a9fd0'

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-[1fr_280px] gap-8 items-start">
      {/* Steps */}
      <div>
        <h2 className="font-condensed font-black text-2xl text-steel mb-1">9-Step Claim Validation</h2>
        <p className="text-sm text-sub mb-6">All state sourced from XRPL ledger "” no off-chain inputs trusted.</p>

        {STEPS.map(s => {
          const isChecked = checked.has(s.n)
          const isOpen    = open.has(s.n)
          return (
            <div
              key={s.n}
              className={`rounded-md border mb-3 overflow-hidden transition-colors ${
                isChecked ? 'border-green bg-[#f0fff8]' : 'border-p2 bg-white'
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer select-none"
                onClick={() => toggleOpen(s.n)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                  isChecked ? 'bg-green text-white' : 'bg-p2 text-[#c8a94a]'
                }`}>{s.n}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-steel">{s.name}</div>
                  <div className="text-sm text-sub truncate">{s.desc}</div>
                </div>
                <svg
                  className={`w-4 h-4 text-dim shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4"/>
                </svg>
                <div
                  onClick={e => { e.stopPropagation(); toggle(s.n) }}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    isChecked ? 'bg-green border-green' : 'border-border'
                  }`}
                >
                  {isChecked && (
                    <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="1.5,6 4.5,9 10.5,3"/>
                    </svg>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className={`px-4 pb-4 text-sm text-sub leading-relaxed border-l-2 ml-4 pl-3 ${isChecked ? 'border-green' : 'border-p2'}`}>
                  {s.detail}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Score sidebar */}
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-p2 rounded-md p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#e2eef8" strokeWidth="6"/>
                <circle
                  cx="40" cy="40" r="32" fill="none" strokeWidth="6" strokeLinecap="round"
                  stroke={ringColor}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset .4s ease, stroke .4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-condensed font-black text-2xl leading-none text-steel">{count}</span>
                <span className="text-sm text-sub font-mono">/ 9</span>
              </div>
            </div>
            <div>
              <div className="font-condensed font-black text-lg text-steel leading-tight">
                {count === 9 ? 'All Steps Passed' : count === 0 ? 'Not Started' : `${count} / 9 Passed`}
              </div>
              <div className={`mt-1 inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded border ${
                count === 9
                  ? 'text-[#00994d] bg-[#e8fff3] border-green'
                  : 'text-dim bg-p2 border-border'
              }`}>
                {count === 9 ? 'âœ“ WARD-CONFORMANT' : 'NOT CONFORMANT'}
              </div>
            </div>
          </div>
          <div className="h-1 bg-p2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct * 100}%`, background: ringColor }}
            />
          </div>
        </div>

        <div className="bg-white border border-p2 rounded-md p-5">
          <h3 className="text-sm uppercase tracking-widest text-sub mb-3">Core Invariants</h3>
          <ul className="space-y-2 text-sm text-sub">
            {[
              ['ward_signed = False', 'Ward never holds signing keys'],
              ['Events are hints', 'Ledger is always truth'],
              ['3-ledger confirmation', 'Required before VerifiedDefault'],
              ['TF_BURNABLE only', 'TF_TRANSFERABLE deliberately absent'],
              ['No off-chain trust', 'Zero oracle dependence'],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ice2 mt-1.5 shrink-0"/>
                <span><strong className="text-steel">{k}</strong> "” {v}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => setChecked(new Set())}
          className="w-full py-2 text-sm uppercase tracking-widest text-sub bg-panel border border-border rounded-md hover:bg-p2 transition-colors"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}
