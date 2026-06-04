import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Certified',
  description:
    'Public registry of vaults certified to implement the Ward Protocol specification correctly. Ward Certified is a technical conformance designation â€” not a financial guarantee.',
}

const vaults = [
  {
    id: 'WP-2026-001',
    address: 'rWardAltnet...001',
    institution: 'Ward Protocol',
    certDate: 'May 2026',
    validUntil: 'May 2027',
    sdkVersion: 'v0.2.4',
    specVersion: 'WARD.SPEC v0.2.4',
    status: 'Active' as const,
    network: 'Altnet' as const,
  },
]

type Status = 'Active' | 'Review Due' | 'Revoked'

const statusStyles: Record<Status, { badge: string; dot: string }> = {
  Active: { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  'Review Due': { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  Revoked: { badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
}

export default function CertifiedPage() {
  return (
    <>
      {/* HERO */}
      <div className="bg-navy px-12 py-24 text-center">
        <p className="text-sm text-white/40 mb-5">
          <Link href="/" className="text-white/40 no-underline hover:text-white/70">
            Home
          </Link>
          {' / Ward Certified'}
        </p>
        <h1 className="text-[52px] font-bold text-white tracking-tight leading-tight mb-5">
          Ward Certified
        </h1>
        <p className="text-[19px] text-white/65 max-w-2xl mx-auto mb-4">
          Vaults verified to implement the Ward Protocol specification correctly.
        </p>
        <p className="text-[14px] text-white/35 max-w-xl mx-auto">
          Ward Certified is a technical conformance designation â€” not a financial guarantee.
        </p>
      </div>

      {/* WHAT IT MEANS */}
      <section className="bg-slate-50 px-12 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: 'âš™ï¸',
              title: 'Technical Review',
              desc: 'Ward verifies the vault implementation against the full 9-step specification.',
            },
            {
              icon: 'ðŸ“‹',
              title: 'Public Record',
              desc: 'Each certification has a unique ID, spec version, and expiry date â€” permanently on record.',
            },
            {
              icon: 'ðŸ”„',
              title: 'Annual Recertification',
              desc: 'Certified vaults are reviewed annually and when major SDK versions are released.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-slate-100 rounded-xl p-7">
              <div className="text-3xl mb-4 w-fit border border-[#c8a94a]/20 rounded-lg p-1">{item.icon}</div>
              <div className="text-[17px] font-bold text-slate-900 mb-2">{item.title}</div>
              <div className="text-[15px] text-slate-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* REGISTRY */}
      <section className="bg-white px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <span className="eyebrow" style={{ color: '#c8a94a' }}>Public Registry</span>
          <h2 className="text-[40px] font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Certified Vaults
          </h2>
          <p className="text-[18px] text-slate-500 leading-relaxed mb-12">
            All Ward Certified vaults are listed here. Certification records are permanent â€”
            revoked entries remain visible with updated status.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white border border-slate-100 rounded-xl overflow-hidden mb-6">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    'Cert ID',
                    'Vault Address',
                    'Institution',
                    'Certified',
                    'Valid Until',
                    'Spec Version',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-sm font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaults.map((v) => {
                  const s = statusStyles[v.status]
                  return (
                    <tr key={v.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-mono text-sm text-[#c8a94a] whitespace-nowrap">
                        {v.id}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-blue-600 whitespace-nowrap">
                        {v.address}
                      </td>
                      <td className="px-5 py-4 text-[14px] text-slate-700 whitespace-nowrap">
                        {v.institution}
                        {v.network === 'Altnet' && (
                          <span className="ml-2 text-sm bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                            ALTNET
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[14px] text-slate-500 whitespace-nowrap">
                        {v.certDate}
                      </td>
                      <td className="px-5 py-4 text-[14px] text-slate-500 whitespace-nowrap">
                        {v.validUntil}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-slate-400 whitespace-nowrap">
                        {v.specVersion}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${s.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-400 italic">
            Mainnet certifications will appear here when XLS-66 goes live on XRPL mainnet.
            The current entry is an Altnet development certification.
          </p>
        </div>
      </section>

      {/* WHAT WARD DOES NOT CERTIFY */}
      <section className="bg-slate-50 px-12 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[20px] font-bold text-slate-900 mb-5">
              What Ward Certified covers
            </h3>
            <ul className="space-y-3">
              {[
                'Vault exists as a valid XLS-66 object on ledger',
                'Policy NFT correctly minted â€” taxon=281, tfBurnable, not transferable',
                'KYC credential valid â€” XLS-70, taxon=282',
                'Ward SDK version current and correctly integrated',
                '3-ledger confirmation window correctly implemented',
                'Escrow settlement using PREIMAGE-SHA-256',
                'ward_signed=False enforced throughout',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">âœ“</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[20px] font-bold text-slate-900 mb-5">
              What Ward Certified does not cover
            </h3>
            <ul className="space-y-3">
              {[
                'Vault collateral quality or solvency',
                'Institution creditworthiness or regulatory status',
                'Whether the preimage holder will submit EscrowFinish',
                'XLS-66 ledger behavior â€” the XRPL enforces that',
                'Any outcome after the 9-step validation completes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <span className="text-slate-300 font-bold mt-0.5 flex-shrink-0">Â·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* APPLY CTA */}
      <section className="bg-white border-t border-gold/20 px-12 py-24 text-center">
        <h2 className="text-[40px] font-bold text-navy tracking-tight leading-tight mb-5">
          Apply for Ward Certified
        </h2>
        <p className="text-[18px] text-navy/65 max-w-xl mx-auto mb-10 leading-relaxed">
          Ward Certified is available for institutions integrating Ward Protocol into XLS-66
          lending vaults. Each vault is certified individually.
        </p>
        <a
          href="mailto:wflores@wardprotocol.org?subject=Ward%20Certified%20Application"
          className="inline-block bg-navy text-white px-10 py-4 rounded-lg font-semibold text-base hover:bg-[#162d47] transition-colors no-underline"
        >
          Apply for Certification â†’
        </a>
        <p className="text-sm text-navy/50 mt-6 max-w-lg mx-auto">
          Ward Certified is a technical conformance designation â€” not a financial guarantee.
          See{' '}
          <Link href="/terms" className="text-navy/60 hover:text-navy/80 underline">
            Terms & Conditions
          </Link>
          .
        </p>
      </section>
    </>
  )
}
