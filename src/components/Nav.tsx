'use client';

import Link from 'next/link';
import { useState } from 'react';

import WardMark from '@/components/WardMark';
import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="premium-nav">
      <div className="site-container flex h-full items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} className="premium-brand" aria-label="Ward Protocol home">
          <WardMark size={42} shape="square" />
          <div>
            <strong>Ward</strong>
            <span>Protocol</span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {SITE_NAVIGATION.map((link) => (
            <Link key={link.href} href={link.href} className="premium-nav-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/docs" className="premium-nav-link">Docs</Link>
          <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="premium-nav-cta">
            Discuss a pilot
          </a>
        </div>

        <button
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="premium-menu-button lg:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <div className="premium-mobile-menu lg:hidden">
          <div className="site-container grid gap-2 py-4">
            {[...SITE_NAVIGATION, { label: 'Docs', href: '/docs' }].map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="premium-mobile-link">
                {link.label}
              </Link>
            ))}
            <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="premium-mobile-cta">
              Discuss a pilot
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
