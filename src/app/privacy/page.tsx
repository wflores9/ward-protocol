import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ward Protocol "” Privacy Policy',
  description: 'Privacy Policy for Ward Protocol.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <h1 className="font-condensed font-black text-4xl text-steel mb-2">Privacy Policy</h1>
      <p className="text-sm text-sub font-mono mb-8">Effective date: 2026-01-01 · Ward Protocol</p>

      <div className="space-y-8 text-sm text-sub leading-relaxed">
        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">1. Information We Collect</h2>
          <p>
            Ward Protocol is an open-source SDK and protocol specification. The wardprotocol.org website
            collects no personal information, sets no tracking cookies, and operates no user accounts.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">2. On-Chain Data</h2>
          <p>
            Ward Protocol reads publicly available data from the XRP Ledger (XRPL). All XRPL
            transactions, account balances, and NFT ownership data are publicly visible on-chain.
            Ward Protocol does not store, transmit, or process private keys or wallet seeds.
          </p>
          <p className="mt-2">
            <strong className="text-steel">ward_signed = False</strong> "” Ward Protocol never holds,
            requests, or processes signing keys. Institutions sign transactions locally.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">3. Third-Party Services</h2>
          <p>
            This website uses Google Fonts for typography. Netlify provides hosting.
            These services may collect standard web access logs subject to their respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">4. Open Source</h2>
          <p>
            Ward Protocol is open-source software released under the MIT License.
            The SDK does not include analytics, telemetry, or usage tracking of any kind.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">5. Contact</h2>
          <p>
            Questions about this policy:{' '}
            <a href="mailto:wflores@wardprotocol.org" className="text-ice2 hover:text-steel transition-colors">
              wflores@wardprotocol.org
            </a>.
          </p>
        </section>
      </div>
    </div>
  )
}
