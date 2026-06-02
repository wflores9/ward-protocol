import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link href="/" className="footer-brand-mark">
            <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="22" cy="22" r="22" fill="#132236" />
              <text x="22" y="28" fontFamily="'Barlow Condensed', sans-serif" fontWeight="900" fontSize="22" textAnchor="middle" fill="#a8c5e8">W</text>
              <rect x="13" y="33" width="18" height="2" rx="1" fill="#c8a94a" />
            </svg>
            <div className="nav-wordmark">
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#a8c5e8', letterSpacing: '-0.5px' }}>WARD</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Protocol</span>
            </div>
          </Link>
          <p className="footer-tagline">Deterministic default resolution for XLS-66 lending vaults on the XRP Ledger.</p>
          <p className="footer-invariant">ward_signed = False — always.</p>
        </div>
        <div>
          <div className="footer-col-label">Product</div>
          <ul className="footer-links">
            <li><Link href="/spec">Protocol</Link></li>
            <li><Link href="/use-cases">Use Cases</Link></li>
            <li><Link href="/build">Build</Link></li>
            <li><Link href="/demo">Demo</Link></li>
            <li><a href="https://tally.so/r/VLDbBE" target="_blank" rel="noopener noreferrer">Get Started</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-label">Resources</div>
          <ul className="footer-links">
            <li><Link href="/spec">Specification</Link></li>
            <li><Link href="/docs">API Reference</Link></li>
            <li><a href="https://pypi.org/project/ward-protocol/" target="_blank" rel="noopener noreferrer">PyPI</a></li>
            <li><a href="https://github.com/wflores9/ward-protocol" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://discord.gg/9BZY4MrU3t" target="_blank" rel="noopener noreferrer">Discord</a></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-label">Legal</div>
          <ul className="footer-links">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms &amp; Conditions</Link></li>
            <li><a href="mailto:wflores@wardprotocol.org">wflores@wardprotocol.org</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 Ward Protocol</span>
        <span className="footer-gold">ward_signed = False — always.</span>
      </div>
    </footer>
  )
}
