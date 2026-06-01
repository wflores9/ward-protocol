'use client'

import { useState } from 'react'

const stats = [
  { val: '317/317', label: 'Tests Passing', green: true },
  { val: 'v0.2.5',  label: 'SDK Version',   green: false },
  { val: '15',      label: 'Attack Vectors Mitigated', green: false },
  { val: '9',       label: 'Validation Steps', green: false },
]

export default function HeroCard() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText('pip install ward-protocol==0.2.5')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Install card */}
      <div className="bg-steel rounded-md p-5 font-mono text-sm">
        <div className="text-dim text-[10px] uppercase tracking-widest mb-3">Install</div>
        <div className="flex items-center justify-between gap-3">
          <code className="text-ice text-[13px]">pip install ward-protocol==0.2.5</code>
          <button
            onClick={copy}
            className="text-[10px] text-dim hover:text-ice transition-colors shrink-0 border border-border rounded px-2 py-1"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* invariant */}
      <div className="bg-deep rounded-md p-4 font-mono text-[12px] border border-border">
        <span className="text-dim"># Core invariant — never changes{'\n'}</span>
        <span className="text-ice">ward_signed</span>
        <span className="text-dim"> = </span>
        <span className="ward-gold">False</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-p2 rounded-md p-4 text-center">
            <div className={`font-condensed font-black text-2xl leading-none mb-1 ${s.green ? 'text-green' : 'text-steel'}`}>
              {s.val}
            </div>
            <div className="text-[10px] text-sub leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
