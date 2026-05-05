'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WardMark from './WardMark'

const links = [
  { href: '/spec',  label: 'Spec'  },
  { href: '/demo',  label: 'Demo'  },
  { href: '/docs',  label: 'Docs'  },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-p2 h-[60px] flex items-center justify-between px-6 md:px-12">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <WardMark size={24} />
        <span className="font-condensed font-black text-[18px] tracking-wide text-steel">
          WARD PROTOCOL
        </span>
      </Link>
      <div className="flex items-center gap-7">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-[11px] tracking-[.05em] transition-colors no-underline ${
              pathname === l.href ? 'text-steel font-bold' : 'text-sub hover:text-steel'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <a
          href="https://github.com/wflores9/ward-protocol"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] bg-steel text-white px-4 py-2 rounded-sm font-bold tracking-[.07em] uppercase hover:bg-mid transition-colors no-underline"
        >
          GitHub
        </a>
      </div>
    </nav>
  )
}
