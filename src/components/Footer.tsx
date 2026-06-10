'use client';

import Link from 'next/link';

import { PILOT_URL, SITE_NAVIGATION } from '@/lib/navigation';

export default function Footer() {
  return (
    <footer className="border-t bg-white" style={{ borderColor: 'rgba(167,197,229,0.3)' }}>
      <div className="site-container grid gap-12 py-14 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
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

          <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#5a7a99]">
            Deterministic default-resolution infrastructure for institutional tokenized credit.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#8aafc8]">
            Reviewable conformance, unsigned settlement instructions, and a preserved institutional signer boundary.
          </p>
          <p className="mt-5 font-mono text-sm font-bold text-[#b8973a]">ward_signed = False — always.</p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Navigation</p>
          <div className="mt-5 grid gap-3 text-sm text-[#5a7a99]">
            {SITE_NAVIGATION.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-[#0f2439]">
                {link.label}
              </Link>
            ))}
            <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-[#0f2439]">
              Discuss a pilot
            </a>
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">Resources</p>
          <div className="mt-5 grid gap-3 text-sm text-[#5a7a99]">
            <Link href="/docs" className="transition hover:text-[#0f2439]">Docs</Link>
            <Link href="/privacy" className="transition hover:text-[#0f2439]">Privacy</Link>
            <Link href="/terms" className="transition hover:text-[#0f2439]">Terms</Link>
            <a href="https://pypi.org/project/ward-protocol/" target="_blank" rel="noopener noreferrer" className="transition hover:text-[#0f2439]">PyPI</a>
            <a href="https://github.com/wflores9/ward-protocol" target="_blank" rel="noopener noreferrer" className="transition hover:text-[#0f2439]">GitHub</a>
            <a href="mailto:wflores@wardprotocol.org" className="transition hover:text-[#0f2439]">wflores@wardprotocol.org</a>
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'rgba(167,197,229,0.25)' }}>
        <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-[#8aafc8]">
          <span>© 2026 Ward Protocol</span>
          <span className="font-mono text-[#b8973a]">Institutional default-resolution standard</span>
        </div>
      </div>
    </footer>
  );
}
