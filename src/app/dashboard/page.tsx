import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ward Dashboard',
  description: 'Read-only compliance dashboard for Ward Certified institutions. Monitor vault health, active escrows, and claim status.',
}

export default function DashboardPage() {
  return (
    <>
      {/* HERO */}
      <div className="bg-navy px-12 py-16 text-center">
        <p className="text-sm text-white/40 mb-5">
          <a href="/" className="text-white/40 no-underline hover:text-white/70">Home</a>
          {' / Dashboard'}
        </p>
        <h1 className="text-[48px] font-bold text-white tracking-tight leading-tight mb-4">
          Institution Dashboard
        </h1>
        <p className="text-[18px] text-white/65 max-w-2xl mx-auto mb-4 leading-relaxed">
          Read-only compliance view for Ward Certified vaults.
          All data sourced directly from XRPL ledger state.
        </p>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-gold rounded-lg px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[13px] font-mono text-white/50">ward_signed = False — always</span>
        </div>
      </div>

      {/* CONNECT SECTION */}
      <section className="bg-slate-50 px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <span className="eyebrow" style={{ color: '#c8a94a' }}>Access</span>
          <h2 className="text-[36px] font-bold text-slate-900 tracking-tight mb-4">
            Ward Certified institutions only
          </h2>
          <p className="text-[17px] text-slate-500 leading-relaxed mb-10">
            The dashboard is accessible to institutions with an active Ward Certified designation
            and a valid <code className="font-mono text-[14px] bg-slate-100 px-2 py-0.5 rounded">X-Institution-Key</code>.
            Enter your key below to connect to your vault data.
          </p>

          {/* KEY INPUT — client component below handles this */}
          <DashboardConnector />
        </div>
      </section>

      {/* WHAT THE DASHBOARD SHOWS */}
      <section className="bg-white px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <span className="eyebrow" style={{ color: '#c8a94a' }}>Features</span>
          <h2 className="text-[36px] font-bold text-slate-900 tracking-tight mb-10">
            What you can monitor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '📊',
                title: 'Vault Health',
                desc: 'Live health ratio for each registered vault. Color-coded: green (healthy), amber (warning), red (critical). Refreshes every ledger close.',
              },
              {
                icon: '⏳',
                title: 'Active Escrows',
                desc: 'All open EscrowObjects associated with your vault policies. Shows condition hex, finish deadline, amount locked, and dispute window remaining.',
              },
              {
                icon: '📋',
                title: 'Claim History',
                desc: 'Historical record of all claim validation results — VALID and INVALID — with rejection step and reason for each INVALID result.',
              },
              {
                icon: '🔐',
                title: 'Policy Registry',
                desc: 'All active policy NFTs (taxon=281) across your registered vaults. Shows depositor address, coverage amount, expiry date, and status.',
              },
              {
                icon: '⚡',
                title: 'Default Alerts',
                desc: "Real-time notification when any vault's health ratio crosses 2.0, 1.75, or 1.5 thresholds. Webhook delivery status shown here.",
              },
              {
                icon: '🏛️',
                title: 'Settlement Audit',
                desc: 'Full audit trail of all escrow settlements — creation, completion, NFT burns. On-chain and verified. ward_signed = False on every record.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6">
                <div className="text-3xl mb-3 w-fit border border-[#c8a94a]/20 rounded-lg p-1">{item.icon}</div>
                <div className="text-[16px] font-bold text-slate-900 mb-2">{item.title}</div>
                <div className="text-[14px] text-slate-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCESS CTA */}
      <section className="bg-white border-t border-gold/20 px-12 py-20 text-center">
        <h2 className="text-[36px] font-bold text-navy tracking-tight mb-5">
          Not yet Ward Certified?
        </h2>
        <p className="text-[17px] text-navy/65 max-w-xl mx-auto mb-10 leading-relaxed">
          The dashboard is available to Ward Certified vaults only.
          Apply for certification to gain access.
        </p>
        <a
          href="mailto:wflores@wardprotocol.org?subject=Ward%20Certified%20Application"
          className="inline-block bg-navy text-white px-10 py-4 rounded-lg font-semibold text-base hover:bg-[#162d47] transition-colors no-underline"
        >
          Apply for Ward Certified →
        </a>
      </section>
    </>
  )
}

// Placeholder — will be replaced with client component
function DashboardConnector() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8">
      <div className="max-w-lg">
        <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Institution Key
        </label>
        <div className="flex gap-3">
          <input
            type="password"
            placeholder="ward_..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg font-mono text-[14px] text-slate-900 bg-slate-50 focus:outline-none focus:border-slate-400"
            readOnly
          />
          <button
            className="px-6 py-3 bg-navy text-white rounded-lg font-semibold text-[14px] opacity-50 cursor-not-allowed"
            disabled
          >
            Connect
          </button>
        </div>
        <p className="text-sm text-slate-400 mt-3 font-mono">
          Live dashboard available for Ward Certified institutions.
          Contact wflores@wardprotocol.org to enable access.
        </p>
      </div>
    </div>
  )
}
