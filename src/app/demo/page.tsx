import type { Metadata } from 'next'
import FlowRunner from '@/components/FlowRunner'
import WardChecklist from '@/components/WardChecklist'
import WalletConnector from '@/components/WalletConnector'

export const metadata: Metadata = {
  title: 'Ward Protocol — Demo & Conformance Checklist',
  description: 'Interactive 9-step Ward Protocol conformance checklist and Python SDK flow examples.',
}

export default function DemoPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-gold/20 bg-white px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs uppercase tracking-[.15em] text-[#c8a94a] mb-2 font-mono">Ward Protocol — Interactive</div>
          <h1 className="font-condensed font-black text-5xl text-steel mb-3">Demo & Checklist</h1>
          <p className="text-sm text-sub max-w-2xl mb-6">
            Verify your integration satisfies all 9 Ward Protocol claim validation steps.
            All state must be sourced from the XRPL ledger — no off-chain inputs trusted.
          </p>
          <WalletConnector />
        </div>
      </div>
      {/* Checklist */}
      <WardChecklist />
      {/* Flow examples */}
      <div className="border-t border-gold/20 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="text-xs uppercase tracking-[.15em] text-[#c8a94a] mb-2 font-mono">Python SDK — v0.2.4</div>
          <h2 className="font-condensed font-black text-3xl text-steel mb-2">Integration Flow Examples</h2>
          <p className="text-[13px] text-sub mb-6">
            Five flows from vault registration to escrow settlement.{' '}
            <span className="ward-gold">ward_signed = False</span> throughout.
          </p>
          <FlowRunner />
        </div>
      </div>
    </>
  )
}
