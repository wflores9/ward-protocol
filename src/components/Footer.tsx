'use client';

import Link from 'next/link';

const DOCS_LINKS = [
  { label: 'Whitepaper', href: '/docs' },
  { label: 'PyPI', href: 'https://pypi.org/project/ward-protocol/', external: true },
  { label: 'npm', href: 'https://www.npmjs.com/package/ward-protocol', external: true },
];

const COMMUNITY_LINKS = [
  { label: 'X (Twitter)', href: 'https://x.com/wardprotocol', external: true },
  { label: 'Discord', href: 'https://discord.gg/j45hnRP3HW', external: true },
  { label: 'GitHub', href: 'https://github.com/wflores9/ward-protocol', external: true },
];

const LEGAL_LINKS = [
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact', href: 'https://tally.so/r/VLDbBE', external: true },
];

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#a7c5e5',
          marginBottom: 14,
        }}
      >
        {heading}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(({ label, href, external }) =>
          external ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: '#5a7a99', textDecoration: 'none' }}
              className="transition hover:text-[#0f2439]"
            >
              {label}
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              style={{ fontSize: 14, color: '#5a7a99', textDecoration: 'none' }}
              className="transition hover:text-[#0f2439]"
            >
              {label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid #E4E9F2' }}>
      <div className="site-container" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="grid gap-10 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 no-underline" style={{ width: 'fit-content' }}>
              <div
                className="relative flex shrink-0 items-center justify-center rounded-full bg-[#0f2439]"
                style={{ width: 40, height: 40 }}
              >
                <span
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#a7c5e5',
                    lineHeight: 1,
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  W
                </span>
                <div
                  className="absolute rounded-[1px] bg-[#b8973a]"
                  style={{ bottom: 8, left: 9, right: 9, height: 2 }}
                />
              </div>
              <div className="flex flex-col" style={{ gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f2439', letterSpacing: '0.04em', lineHeight: 1 }}>
                  WARD
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: '#a7c5e5',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  PROTOCOL
                </span>
              </div>
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: '#8a9bb0', lineHeight: 1.65, maxWidth: 220 }}>
              Deterministic default resolution infrastructure.
            </p>
          </div>

          <FooterCol heading="Docs" links={DOCS_LINKS} />
          <FooterCol heading="Community" links={COMMUNITY_LINKS} />
          <FooterCol heading="Legal" links={LEGAL_LINKS} />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="site-container"
        style={{
          borderTop: '1px solid #E4E9F2',
          paddingTop: 16,
          paddingBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p style={{ fontSize: 11, color: '#8a9bb0' }}>© 2026 Ward Labs LLC</p>
        <p
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11,
            color: '#b8973a',
          }}
        >
          ward_signed = False — always.
        </p>
      </div>
    </footer>
  );
}
