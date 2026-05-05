import Link from 'next/link'
import HeroCard from '@/components/HeroCard'
import FlowRunner from '@/components/FlowRunner'

const features = [
  {
    icon: '🛡',
    title: 'Trustless Default Detection',
    body: '3-ledger confirmation via WebSocket ledger stream. Events are hints — ledger is always truth. Reconnects automatically with exponential back-off.',
  },
  {
    icon: '✓',
    title: '9-Step Claim Validation',
    body: 'All state sourced from XRPL ledger. NFT existence, expiry, vault binding, default flag, pool solvency, rate limiting — no off-chain inputs trusted.',
  },
  {
    icon: '🔐',
    title: 'PREIMAGE-SHA-256 Escrow',
    body: 'Claimant holds preimage. Ward receives condition_hex only. EscrowCreate + EscrowFinish settled natively on XRPL. ward_signed = False throughout.',
  },
  {
    icon: '📊',
    title: 'Pool Health Monitoring',
    body: 'Coverage ratio ≥ 1.5×. XRPL reserve accounting. Real-time pool state. 15 attack vectors mitigated and tested.',
  },
]

const tiers = [
  {
    name:  'Starter',
    desc:  'For individual developers and small teams exploring Ward Protocol on XRPL Testnet.',
    items: ['SDK access', 'XRPL Testnet', 'Community support', 'Open-source MIT'],
  },
  {
    name:  'Standard',
    desc:  'For teams building production integrations on XLS-66 lending vaults.',
    items: ['Everything in Starter', 'Mainnet access', 'Priority support', 'Audit report access'],
    featured: true,
  },
  {
    name:  'Enterprise',
    desc:  'For institutional lenders requiring SLA, dedicated support, and custom integrations.',
    items: ['Everything in Standard', 'SLA guarantee', 'Dedicated integration support', 'Custom coverage ratios'],
  },
]

export default function Home() {
  return (
    <>
      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="contents">
              <span className="tick-item"><span className="tk">TESTS</span><span className="tv g">146/146</span></span>
              <span className="tick-item"><span className="tk">SDK</span><span className="tv">v0.2.2</span></span>
              <span className="tick-item"><span className="tk">NETWORK</span><span className="tv">XRPL MAINNET</span></span>
              <span className="tick-item"><span className="tk">STANDARD</span><span className="tv">XLS-66 · XLS-20</span></span>
              <span className="tick-item"><span className="tk">SIGNED</span><span className="tv au">ward_signed = False</span></span>
              <span className="tick-item"><span className="tk">ATTACK VECTORS</span><span className="tv g">15/15 MITIGATED</span></span>
              <span className="tick-item"><span className="tk">COVERAGE</span><span className="tv">MIN 1.5×</span></span>
              <span className="tick-item"><span className="tk">CONFIRMS</span><span className="tv">3 LEDGERS</span></span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 grid md:grid-cols-[1fr_380px] gap-16 items-center border-b border-p2">
        <div>
          <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-3 font-mono">
            Ward Protocol — Open Specification
          </div>
          <h1 className="font-condensed font-black text-[clamp(40px,6vw,68px)] leading-[.95] text-steel mb-5">
            Default Protection<br />
            for <span className="text-ice2">XLS-66</span><br />
            Lending Vaults
          </h1>
          <p className="text-[14px] text-sub leading-relaxed max-w-lg mb-8">
            Ward Protocol is the open specification for deterministic, trustless default
            protection on XLS-66 institutional lending vaults on the XRP Ledger.
            No oracles. No custodial keys. No off-chain trust.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/spec" className="bg-steel text-white text-[12px] font-bold px-5 py-2.5 rounded-sm tracking-wider uppercase hover:bg-mid transition-colors no-underline">
              Read the Spec
            </Link>
            <Link href="/docs" className="border border-border text-steel text-[12px] font-bold px-5 py-2.5 rounded-sm tracking-wider uppercase hover:bg-p2 transition-colors no-underline">
              Documentation
            </Link>
          </div>
        </div>
        <HeroCard />
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 border-b border-p2">
        <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-3 font-mono">Core Modules</div>
        <h2 className="font-condensed font-black text-4xl text-steel mb-10">Built for Institutional DeFi</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(f => (
            <div key={f.title} className="bg-white border border-p2 rounded-md p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-condensed font-black text-lg text-steel mb-2">{f.title}</h3>
              <p className="text-[12px] text-sub leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flow examples */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 border-b border-p2">
        <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-3 font-mono">Python SDK — v0.2.2</div>
        <h2 className="font-condensed font-black text-4xl text-steel mb-2">Integration Flows</h2>
        <p className="text-[13px] text-sub mb-8">
          Five flows from vault registration to escrow settlement. <span className="ward-gold">ward_signed = False</span> throughout every step.
        </p>
        <FlowRunner />
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="text-[10px] uppercase tracking-[.15em] text-ice2 mb-3 font-mono">Licensing</div>
        <h2 className="font-condensed font-black text-4xl text-steel mb-2">Access Tiers</h2>
        <p className="text-[13px] text-sub mb-10">Three tiers for individual developers, product teams, and institutional lenders.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map(t => (
            <div
              key={t.name}
              className={`rounded-md border p-6 flex flex-col ${
                t.featured ? 'border-ice2 bg-steel text-white' : 'border-p2 bg-white'
              }`}
            >
              <div className={`font-condensed font-black text-2xl mb-2 ${t.featured ? 'text-ice' : 'text-steel'}`}>
                {t.name}
              </div>
              <p className={`text-[12px] leading-relaxed mb-6 ${t.featured ? 'text-ice/70' : 'text-sub'}`}>
                {t.desc}
              </p>
              <ul className="space-y-2 mb-8 flex-1">
                {t.items.map(item => (
                  <li key={item} className={`flex items-start gap-2 text-[12px] ${t.featured ? 'text-ice' : 'text-sub'}`}>
                    <span className={`mt-0.5 ${t.featured ? 'text-green' : 'text-ice2'}`}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className={`text-[11px] font-bold tracking-widest uppercase py-2.5 px-4 rounded border text-center ${
                t.featured
                  ? 'border-ice/30 text-ice/60'
                  : 'border-border text-dim'
              }`}>
                Coming Soon
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
