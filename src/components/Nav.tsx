'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav sticky top-0 z-[100] border-b bg-white" style={{ borderColor: '#E4E9F2' }}>
      <div className="site-container flex h-[72px] items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 no-underline">
          <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#0f2439]">
            <span className="text-[20px] font-extrabold leading-none text-[#a7c5e5]">W</span>
            <div className="absolute bottom-[7px] left-[9px] right-[9px] h-[2px] rounded-[1px] bg-[#b8973a]" />
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-[13px] font-bold tracking-[0.14em] text-[#0f2439]">WARD</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#a7c5e5]">Protocol</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {SITE_NAVIGATION.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-[14px] font-medium text-[#0f2439] transition hover:bg-[rgba(167,197,229,0.15)] hover:text-[#0d1f32]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={PILOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex min-h-[38px] items-center rounded-lg bg-[#0f2439] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#0d1f32]"
          >
            Discuss a pilot
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
              Discuss a pilot
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
