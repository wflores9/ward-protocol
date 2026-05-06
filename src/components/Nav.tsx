import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="nav-brand">
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
      <ul className="nav-links">
        <li><Link href="/spec">Specification</Link></li>
        <li><Link href="/docs">Documentation</Link></li>
        <li><Link href="/demo">Demo</Link></li>
        <li><Link href="/certified">Certified</Link></li>
        <li><a href="mailto:wflores@wardprotocol.org" className="nav-cta">Contact Us</a></li>
      </ul>
    </nav>
  )
}
