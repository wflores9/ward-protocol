'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav sticky top-0 z-[100] bg-white" style={{ borderBottom: '1px solid #E4E9F2', height: 64 }}>
      <div className="site-container flex h-full items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 no-underline">
          <div
            className="relative flex shrink-0 items-center justify-center rounded-full bg-[#0f2439]"
            style={{ width: 44, height: 44 }}
          >
            <span
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 22,
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
              style={{ bottom: 8, left: 10, right: 10, height: 2 }}
            />
          </div>
          <div className="flex flex-col" style={{ gap: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f2439', letterSpacing: '0.04em', lineHeight: 1 }}>
              WARD
            </span>
            <span
              style={{
                fontSize: 10,
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

        {/* Desktop nav */}
        <div className="hidden items-center md:flex" style={{ gap: 32 }}>
          {SITE_NAVIGATION.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[#0f2439]"
              style={{ fontSize: 14, color: '#4a6580', textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={PILOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:bg-[#0d1f32]"
            style={{
              background: '#0f2439',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 22px',
              borderRadius: 8,
              letterSpacing: '-0.01em',
              textDecoration: 'none',
            }}
          >
            Discuss a pilot →
          </a>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-xl text-[#0f2439]"
            style={{ borderColor: '#E4E9F2' }}
          >
            {open ? '×' : '≡'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-white px-6 pb-6 pt-4 md:hidden" style={{ borderColor: '#E4E9F2' }}>
          <div className="site-container space-y-1 px-0">
            {SITE_NAVIGATION.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg border px-4 py-3 text-[15px] font-medium text-[#0f2439]"
                style={{ borderColor: '#E4E9F2', background: '#F9FAFC' }}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={PILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-lg bg-[#0f2439] px-5 py-3 text-center text-[15px] font-semibold text-white"
            >
              Discuss a pilot →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
