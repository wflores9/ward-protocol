import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ward Protocol — Terms of Service',
  description: 'Terms of Service for Ward Protocol.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <h1 className="font-condensed font-black text-4xl text-steel mb-2">Terms of Service</h1>
      <p className="text-[11px] text-sub font-mono mb-8">Effective date: 2026-01-01 · Ward Protocol</p>

      <div className="space-y-8 text-[13px] text-sub leading-relaxed">
        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">1. Acceptance</h2>
          <p>
            By using Ward Protocol software, documentation, or website, you agree to these terms.
            Ward Protocol is open-source software released under the MIT License.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">2. MIT License</h2>
          <p>
            Ward Protocol is provided under the MIT License. You are free to use, copy, modify,
            merge, publish, distribute, sublicense, and/or sell copies of the software, subject to
            the conditions of the MIT License included in the repository.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">3. No Warranty</h2>
          <p>
            Ward Protocol is provided &quot;AS IS&quot;, without warranty of any kind, express or implied.
            The authors make no representations about the suitability of this software for any purpose.
            Use in production requires independent security review.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">4. Financial Risk Disclosure</h2>
          <p>
            Ward Protocol provides infrastructure for on-chain insurance mechanisms on the XRP Ledger.
            Use of this protocol involves interaction with blockchain networks and smart contracts,
            which carry inherent technical and financial risks. Users are solely responsible for
            assessing these risks and should seek independent professional advice before deploying
            in a production environment.
          </p>
          <p className="mt-2">
            Ward Protocol does not provide financial, legal, or investment advice.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">5. Key Management</h2>
          <p>
            <strong className="text-steel">ward_signed = False</strong> — Ward Protocol is designed
            so that it never holds, requests, or processes private keys or wallet seeds. Users remain
            solely responsible for the security of their signing keys. Loss of keys is irreversible.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the authors of Ward Protocol shall not be liable
            for any indirect, incidental, special, exemplary, or consequential damages arising from
            the use or inability to use the software.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">7. Changes</h2>
          <p>
            These terms may be updated. Continued use of Ward Protocol software after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-black text-xl text-steel mb-2">8. Contact</h2>
          <p>
            Questions:{' '}
            <a href="https://github.com/wflores9/ward-protocol" className="text-ice2 hover:text-steel transition-colors">
              github.com/wflores9/ward-protocol
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
