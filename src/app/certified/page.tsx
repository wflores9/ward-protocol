import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ward Conformance | Certification for Tokenized Credit',
  description:
    'Ward Conformance is the technical certification path for tokenized credit products that need deterministic default resolution, nine on-ledger checks, and signer-boundary proof.',
  openGraph: {
    title: 'Ward Conformance',
    description: 'Technical certification for deterministic default resolution in tokenized credit.',
    images: [{ url: '/brand/ward-banner.png', width: 1920, height: 480 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Conformance',
    description: 'Certification for tokenized credit products integrating Ward Protocol.',
  },
};

const registry = [
  {
    id: 'WARD-CONF-2026-001',
    product: 'Ward Protocol Reference Vault',
    network: 'XRPL Altnet',
    status: 'Reference',
    checks: '9/9',
    signerBoundary: 'Institution signs',
    version: 'v0.2.6',
  },
];

const covers = [
  'Chain primitive maps correctly into the Ward conformance engine',
  'Nine deterministic checks are executed before settlement instructions are produced',
  'Policy reference, vault binding, claimant ownership, and pool solvency are reviewable',
  'Settlement packet remains unsigned by Ward',
  'Receipt can be exported for engineering, risk, and compliance review',
];

const doesNotCover = [
  'Credit quality of the borrower or institution',
  'Investment performance or repayment guarantee',
  'Regulatory approval in any jurisdiction',
  'Settlement actions after the institution signs',
  'Third-party audit replacement before mainnet launch',
];

export default function CertifiedPage() {
  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] px-6 py-20 text-[#f7faf8] md:px-10 lg:px-12">
        <img src="/brand/ward-banner.png" alt="Ward Conformance registry" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[#14242b]/90" />
        <div className="absolute inset-0 grid-overlay" />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-mono text-sm font-bold text-[#d4a93e]">Ward Conformance</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Certification for the default-resolution layer institutions need to trust.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
            Ward Conformance verifies that a tokenized credit product implements deterministic default resolution, preserves the signer boundary, and can produce a reviewable receipt.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">
              Run Console
            </Link>
            <a href="mailto:wflores@wardprotocol.org?subject=Ward%20Conformance%20Review" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">
              Request Review
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">Public registry</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14242b] md:text-5xl">
              Conformance records make the default path inspectable.
            </h2>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#14242b]/10 bg-white">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-[#f6f4ee]">
                <tr>
                  {['Record', 'Product', 'Network', 'Status', 'Checks', 'Signer Boundary', 'Version'].map((header) => (
                    <th key={header} className="px-5 py-4 text-left font-mono text-sm font-bold text-[#52665f]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registry.map((item) => (
                  <tr key={item.id} className="border-t border-[#14242b]/10">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-[#9b6d13]">{item.id}</td>
                    <td className="px-5 py-4 text-base font-bold text-[#14242b]">{item.product}</td>
                    <td className="px-5 py-4 text-base text-[#52665f]">{item.network}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-[#00cc66]/30 bg-[#00cc66]/10 px-3 py-1.5 font-mono text-sm font-bold text-[#116c3b]">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-bold text-[#14242b]">{item.checks}</td>
                    <td className="px-5 py-4 text-base text-[#52665f]">{item.signerBoundary}</td>
                    <td className="px-5 py-4 font-mono text-sm text-[#52665f]">{item.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#52665f]">
            Mainnet production certifications will appear after the external audit path and mainnet launch readiness are complete.
          </p>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-2 lg:px-12">
          <article className="rounded-lg border border-[#14242b]/10 bg-white p-6">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">What conformance covers</p>
            <h2 className="mt-3 text-3xl font-black text-[#14242b]">Technical default-resolution readiness.</h2>
            <div className="mt-6 grid gap-3">
              {covers.map((item) => (
                <div key={item} className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] p-4 text-base leading-7 text-[#52665f]">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#14242b]/10 bg-white p-6">
            <p className="font-mono text-sm font-bold text-[#9b6d13]">What it does not cover</p>
            <h2 className="mt-3 text-3xl font-black text-[#14242b]">No financial guarantee, no custody promise.</h2>
            <div className="mt-6 grid gap-3">
              {doesNotCover.map((item) => (
                <div key={item} className="rounded-md border border-[#14242b]/10 bg-[#f6f4ee] p-4 text-base leading-7 text-[#52665f]">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="bg-[#14242b] py-16 text-center text-[#f7faf8]">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-mono text-sm font-bold text-[#d4a93e]">Pre-mainnet assurance path</p>
          <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            Ward Conformance is the bridge between a working integration and institutional confidence.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#d2e1dd]">
            The next unlock is third-party review, production pilots, and mainnet-ready certification once the underlying lending primitives are live.
          </p>
        </div>
      </section>
    </main>
  );
}
