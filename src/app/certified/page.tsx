import type { Metadata } from 'next';
import Link from 'next/link';

import { getPublishedPackageVersions } from '@/lib/packageVersions';
import { formatPackageVersion } from '@/lib/wardMetrics';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Ward Conformance | Certification for Tokenized Credit',
  description:
    'Ward Conformance is the technical certification path for tokenized credit products that need deterministic default resolution, nine on-ledger checks, and signer-boundary proof.',
  openGraph: {
    title: 'Ward Conformance',
    description: 'Technical certification for deterministic default resolution in tokenized credit.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
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

export default async function CertifiedPage() {
  const packageVersions = await getPublishedPackageVersions();
  const registryWithVersion = registry.map((item) => ({
    ...item,
    version: formatPackageVersion(packageVersions.display),
  }));

  return (
    <main className="site-shell">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="site-container pb-24 pt-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="site-label">Ward Conformance</p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f2439] md:text-[48px]">
              Certification for the default-resolution layer institutions need to trust.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-[#5a7a99]">
              Ward Conformance verifies that a tokenized credit product implements deterministic default resolution,
              preserves the signer boundary, and can produce a reviewable receipt.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg bg-[#0f2439] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0d1f32]"
              >
                Run Demo
              </Link>
              <a
                href="mailto:wflores@wardprotocol.org?subject=Ward%20Conformance%20Review"
                className="inline-flex items-center rounded-lg border px-6 py-3 text-[15px] font-semibold text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.12)]"
                style={{ borderColor: 'rgba(15,36,57,0.18)' }}
              >
                Request Review
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Public registry */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="mb-8 max-w-xl">
            <p className="site-label">Public registry</p>
            <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
              Conformance records make the default path inspectable.
            </h2>
          </div>
          <div
            className="overflow-x-auto rounded-xl border bg-white shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
            style={{ borderColor: '#E4E9F2' }}
          >
            <table className="w-full min-w-[860px] border-collapse">
              <thead style={{ background: '#F9FAFC', borderBottom: '1px solid #E4E9F2' }}>
                <tr>
                  {['Record', 'Product', 'Network', 'Status', 'Checks', 'Signer Boundary', 'Version'].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registryWithVersion.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #E4E9F2' }}>
                    <td className="px-5 py-4 font-mono text-[12px] font-bold text-[#b8973a]">{item.id}</td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#0f2439]">{item.product}</td>
                    <td className="px-5 py-4 text-[14px] text-[#5a7a99]">{item.network}</td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-md px-3 py-1 font-mono text-[12px] font-bold"
                        style={{
                          background: 'rgba(22,163,74,0.08)',
                          color: '#15803d',
                          border: '1px solid rgba(22,163,74,0.25)',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[13px] font-bold text-[#0f2439]">{item.checks}</td>
                    <td className="px-5 py-4 text-[14px] text-[#5a7a99]">{item.signerBoundary}</td>
                    <td className="px-5 py-4 font-mono text-[12px] text-[#5a7a99]">{item.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] leading-6 text-[#8a9bb0]">
            Mainnet production certifications will appear after the external audit path and mainnet launch readiness are
            complete.
          </p>
        </div>
      </section>

      {/* Covers / Does not cover */}
      <section className="site-section">
        <div className="site-container py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <article
              className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
              style={{ borderColor: '#E4E9F2' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#b8973a]">
                What conformance covers
              </p>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-[#0f2439]">
                Technical default-resolution readiness.
              </h2>
              <div className="mt-6 grid gap-3">
                {covers.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg p-4 text-[14px] leading-[1.7] text-[#5a7a99]"
                    style={{ background: '#F9FAFC', border: '1px solid #E4E9F2' }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article
              className="rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.06)]"
              style={{ borderColor: '#E4E9F2' }}
            >
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#a7c5e5]">
                What it does not cover
              </p>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-[#0f2439]">
                No financial guarantee, no custody promise.
              </h2>
              <div className="mt-6 grid gap-3">
                {doesNotCover.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg p-4 text-[14px] leading-[1.7] text-[#5a7a99]"
                    style={{ background: '#F9FAFC', border: '1px solid #E4E9F2' }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section">
        <div className="site-container py-20">
          <div
            className="rounded-xl border bg-white p-8 shadow-[0_1px_3px_rgba(15,36,57,0.06)] md:p-10"
            style={{ borderColor: '#E4E9F2' }}
          >
            <div className="max-w-2xl">
              <p className="site-label">Pre-mainnet assurance path</p>
              <h2 className="mt-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-[#0f2439]">
                Ward Conformance is the bridge between a working integration and institutional confidence.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">
                The next unlock is third-party review, production pilots, and mainnet-ready certification once the
                underlying lending primitives are live.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
