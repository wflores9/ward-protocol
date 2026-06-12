'use client';

import React from 'react';
import Link from 'next/link';
import WardMark from '@/components/WardMark';

const DOCS_LINKS = [
  { label: 'Whitepaper', href: '/docs' },
  { label: 'PyPI', href: 'https://pypi.org/project/ward-protocol/', external: true },
  { label: 'npm', href: 'https://www.npmjs.com/package/ward-protocol', external: true },
];

const COMMUNITY_LINKS = [
  {
    label: 'X (Twitter)',
    href: 'https://x.com/wardprotocol',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/j45hnRP3HW',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.11 18.1.13 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/wflores9/ward-protocol',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
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
  links: { label: string; href: string; external?: boolean; icon?: React.ReactNode }[];
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
        {links.map(({ label, href, external, icon }) => {
          const inner = (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {icon}
              {label}
            </span>
          );
          return external ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: '#4a6580', textDecoration: 'none' }}
              className="transition hover:text-[#0f2439]"
            >
              {inner}
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              style={{ fontSize: 14, color: '#5a7a99', textDecoration: 'none' }}
              className="transition hover:text-[#0f2439]"
            >
              {inner}
            </Link>
          );
        })}
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
              <WardMark size={40} shape="circle" />
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
