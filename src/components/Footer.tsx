'use client';

import Link from 'next/link';

import { PILOT_URL } from '@/lib/navigation';

const PRODUCT_LINKS = [
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Conformance', href: '/conformance' },
  { label: 'Assurance', href: '/assurance' },
  { label: 'Demo', href: '/demo' },
  { label: 'Protocol + Build', href: '/build' },
];

const DOCS_LINKS = [
  { label: 'Whitepaper', href: '/spec' },
  { label: 'Code Architecture', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com/wflores9/ward-protocol', external: true },
  { label: 'Changelog', href: '/docs#changelog' },
  { label: 'PyPI', href: 'https://pypi.org/project/ward-protocol/', external: true },
  { label: 'npm', href: 'https://www.npmjs.com/package/@wardprotocol/sdk', external: true },
];

const COMMUNITY_LINKS = [
  { label: 'X (Twitter)', href: 'https://x.com/wardprotocol', external: true },
  { label: 'Discord', href: 'https://discord.gg/wardprotocol', external: true },
  { label: 'GitHub Discussions', href: 'https://github.com/wflores9/ward-protocol/discussions', external: true },
];

const LEGAL_LINKS = [
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact', href: 'mailto:wflores@wardprotocol.org', external: true },
];

function FooterLinkList({ links }: { links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <div className="mt-4 grid gap-2.5">
      {links.map(({ label, href, external }) =>
        external ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[#5a7a99] transition hover:text-[#0f2439]"
          >
            {label}
          </a>
        ) : (
          <Link key={label} href={href} className="text-[14px] text-[#5a7a99] transition hover:text-[#0f2439]">
            {label}
          </Link>
        ),
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t bg-white" style={{ borderColor: 'rgba(167,197,229,0.3)' }}>
      <div className="site-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr]">
          {/* Logo + tagline */}
          <div>
            <Link href="/" className="flex items-center gap-3 no-underline">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#0f2439]">
                <span className="text-lg font-bold text-[#a7c5e5]">W</span>
                <div className="absolute bottom-[5px] left-2 right-2 h-[2px] rounded-sm bg-[#b8973a]" />
                <span className="absolute bottom-[2px] right-[3px] text-[8px] leading-none text-[#a7c5e5]/40">✦</span>
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-[13px] font-bold tracking-[0.14em] text-[#0f2439]">WARD</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a7c5e5]">Protocol</span>
              </div>
            </Link>
            <p className="mt-5 max-w-[260px] text-[14px] leading-[1.7] text-[#5a7a99]">
              Deterministic default-resolution infrastructure for institutional tokenized credit.
            </p>
            <p className="mt-4 font-mono text-[12px] font-bold text-[#b8973a]">ward_signed = False — always.</p>
            <a
              href={PILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center rounded-lg bg-[#0f2439] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0d1f32]"
            >
              Discuss a pilot →
            </a>
          </div>

          {/* Product */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Product</p>
            <FooterLinkList links={PRODUCT_LINKS} />
          </div>

          {/* Docs */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Docs</p>
            <FooterLinkList links={DOCS_LINKS} />
          </div>

          {/* Community */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Community</p>
            <FooterLinkList links={COMMUNITY_LINKS} />
          </div>

          {/* Legal */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Legal</p>
            <FooterLinkList links={LEGAL_LINKS} />
          </div>
        </div>
      </div>

      <div className="border-t py-5 text-center" style={{ borderColor: 'rgba(167,197,229,0.25)' }}>
        <p className="font-mono text-[11px] text-[#8aafc8]">
          © 2026 Ward Labs LLC —{' '}
          <span className="text-[#b8973a]">ward_signed = False — always.</span>
        </p>
      </div>
    </footer>
  );
}
