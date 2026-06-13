'use client'

import { useState } from 'react'

import { formatPackageVersion, WARD_MARKETING_STATS } from '@/lib/wardMetrics'

export default function HeroCard({ packageVersion = 'latest' }: { packageVersion?: string }) {
  const [copied, setCopied] = useState(false)
  const installCommand = packageVersion === 'latest'
    ? 'pip install ward-protocol'
    : `pip install ward-protocol==${packageVersion}`
  const stats = [
    { val: `${WARD_MARKETING_STATS.testsPassing}/${WARD_MARKETING_STATS.testsPassing}`, label: 'Tests Passing', green: true },
    { val: packageVersion === 'latest' ? 'latest' : formatPackageVersion(packageVersion), label: 'SDK Version', green: false },
    { val: '15', label: 'Attack Vectors Mitigated', green: false },
    { val: '9', label: 'Validation Steps', green: false },
  ]

  const copy = () => {
    navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Install card */}
      <div className="bg-steel rounded-md p-5 font-mono text-sm">
        <div className="text-dim text-sm uppercase mb-3">Install</div>
        <div className="flex items-center justify-between gap-3">
          <code className="text-ice text-sm">{installCommand}</code>
          <button
            onClick={copy}
            className="text-sm text-dim hover:text-ice transition-colors shrink-0 border border-border rounded px-2 py-1"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* invariant */}
      <div className="bg-deep rounded-md p-4 font-mono text-sm border border-border">
        <span className="text-dim"># Core invariant — never changes{'\n'}</span>
        <span className="text-ice">ward_signed</span>
        <span className="text-dim"> = </span>
        <span className="ward-gold">False</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-p2 rounded-md p-4 text-center">
            <div className={`font-sans font-black text-2xl leading-none mb-1 ${s.green ? 'text-green' : 'text-steel'}`}>
              {s.val}
            </div>
            <div className="text-sm text-sub leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
