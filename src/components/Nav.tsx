'use client';

import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Conformance', href: '/conformance' },
  { label: 'Demo', href: '/demo' },
  { label: 'Protocol', href: '/spec' },
  { label: 'Build', href: '/build' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav sticky top-0 z-[100] border-b border-white/10 bg-[#07131a]/88 backdrop-blur-xl">
      <div className="site-container flex h-[80px] items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-4 no-underline">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04]">
            <span className="text-xl font-black text-[#f7f9f7]">W</span>
            <div className="absolute bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded bg-[#d4a93e]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-black tracking-[0.16em] text-[#f7f9f7]">WARD</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9eb0b7]">Protocol</span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#d0dde0] transition hover:bg-white/[0.04] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://tally.so/r/VLDbBE"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 inline-flex min-h-10 items-center rounded-full border border-[#d4a93e]/30 bg-[#d4a93e] px-5 py-2 text-sm font-bold text-[#07131a] transition hover:brightness-105"
          >
            Discuss a pilot
          </a>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/demo"
            className="rounded-full border border-white/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#d0dde0]"
          >
            Demo
          </Link>
          <button
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-[#f7f9f7]"
          >
            {open ? '×' : '≡'}
          </button>
        </div>
      </div>

      <button
        className="hidden"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? '✕' : '≡'}
      </button>

      {open && (
        <div className="border-t border-white/10 bg-[#0a161d]/98 px-6 pb-6 pt-4 md:hidden">
          <div className="site-container space-y-2 px-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-base font-semibold text-[#f7f9f7]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/use-cases"
              onClick={() => setOpen(false)}
              className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-base font-semibold text-[#f7f9f7]"
            >
              Use Cases
            </Link>
            <a
              href="https://tally.so/r/VLDbBE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-[#d4a93e] px-5 py-3 text-center text-sm font-bold text-[#07131a]"
            >
              Discuss a pilot
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
