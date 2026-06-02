'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Protocol',   href: '/spec',       ext: false },
  { label: 'Use Cases',  href: '/use-cases',  ext: false },
  { label: 'Build',      href: '/build',      ext: false },
  { label: 'Demo',       href: '/demo',       ext: false },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="site-nav">
      {/* Brand — always visible */}
      <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
        <svg className="nav-mark" width="56" height="56" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="22" cy="22" r="22" fill="#0d1f35" />
          <text x="22" y="28" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="22" textAnchor="middle" fill="#a8c5e8" letterSpacing="-0.5">W</text>
          <rect x="13" y="33" width="18" height="2" rx="1" fill="#c8a94a" />
        </svg>
        <div className="nav-wordmark">
          <span className="nav-ward">WARD</span>
          <span className="nav-protocol">Protocol</span>
        </div>
      </Link>

      {/* Desktop links — hidden on mobile */}
      <ul className="nav-links hidden md:flex">
        {navLinks.map(l => (
          <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
        ))}
        <li>
          <a
            href="https://tally.so/r/VLDbBE"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta"
          >
            Get Started →
          </a>
        </li>
      </ul>

      {/* Mobile hamburger — hidden on desktop */}
      <button
        className="md:hidden flex items-center justify-center w-10 h-10 text-[#a8c5e8] text-2xl leading-none"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? '✕' : '≡'}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="md:hidden absolute top-full left-0 right-0 z-50 flex flex-col"
          style={{ background: '#0d1f35', borderTop: '1px solid rgba(168,197,232,0.1)' }}
        >
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-6 py-4 text-[#a8c5e8] text-sm font-medium border-b border-[rgba(168,197,232,0.08)] no-underline hover:bg-[rgba(168,197,232,0.06)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="px-6 py-4">
            <a
              href="https://tally.so/r/VLDbBE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-semibold no-underline rounded-md py-3 px-4"
              style={{ background: '#c8a94a', color: '#0d1f35' }}
            >
              Get Started →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
