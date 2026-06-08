'use client';

import Link from 'next/link';

import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#061118]">
      <div className="site-container grid gap-12 py-16 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="flex items-center gap-4 no-underline">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04]">
              <span className="text-xl font-black text-[#f7f9f7]">W</span>
              <div className="absolute bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded bg-[#d4a93e]" />
            </div>
            <div>
              <div className="text-base font-black tracking-[0.14em] text-[#f7f9f7]">WARD</div>
              <div className="font-mono text-sm uppercase tracking-[0.12em] text-[#9eb0b7]">Protocol</div>
            </div>
          </Link>

          <p className="mt-5 max-w-sm text-base leading-7 text-[#d0dde0]">
            Deterministic default-resolution infrastructure for institutional tokenized credit.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#9eb0b7]">
            Reviewable conformance, unsigned settlement instructions, and a preserved institutional signer boundary.
          </p>
          <p className="mt-5 font-mono text-sm font-bold text-[#d4a93e]">ward_signed = False - always.</p>
        </div>

        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#9eb0b7]">Navigation</p>
          <div className="mt-5 grid gap-3 text-sm text-[#d0dde0]">
            {SITE_NAVIGATION.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
            <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
              Discuss a pilot
            </a>
          </div>
        </div>

        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-[#9eb0b7]">Resources</p>
          <div className="mt-5 grid gap-3 text-sm text-[#d0dde0]">
            <Link href="/docs" className="transition hover:text-white">Docs</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <a href="https://pypi.org/project/ward-protocol/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">PyPI</a>
            <a href="https://github.com/wflores9/ward-protocol" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">GitHub</a>
            <a href="mailto:wflores@wardprotocol.org" className="transition hover:text-white">wflores@wardprotocol.org</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-[#9eb0b7]">
          <span>© 2026 Ward Protocol</span>
          <span className="font-mono text-[#d4a93e]">Institutional default-resolution standard</span>
        </div>
      </div>
    </footer>
  );
}
