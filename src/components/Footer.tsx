import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#060d1a',
      borderTop: '1px solid rgba(168,197,232,0.08)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '64px 32px 40px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48,
      }} className="footer-grid">
        {/* Brand */}
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(168,197,232,0.08)',
              border: '1px solid rgba(168,197,232,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 17, color: '#a8c5e8' }}>W</span>
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 2, background: '#c8a94a', borderRadius: 1 }} />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 14, color: '#e8edf5', letterSpacing: '0.08em' }}>WARD</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, fontSize: 10, color: '#6b7a99', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Protocol</div>
            </div>
          </Link>
          <p style={{ fontSize: 13, color: '#6b7a99', lineHeight: 1.6, marginBottom: 8, maxWidth: 240 }}>
            Deterministic default resolution for on-chain lending.
          </p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#c8a94a', marginTop: 12 }}>
            ward_signed = False — always.
          </p>
        </div>

        {/* Product */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#3d4f6e', textTransform: 'uppercase', marginBottom: 16 }}>PRODUCT</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Protocol', href: '/spec' },
              { label: 'Use Cases', href: '/use-cases' },
              { label: 'Build', href: '/build' },
              { label: 'Demo', href: '/demo' },
              { label: 'Get Started', href: 'https://tally.so/r/VLDbBE', ext: true },
            ].map(l => (
              <li key={l.label}>
                {l.ext
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#3d4f6e', textTransform: 'uppercase', marginBottom: 16 }}>RESOURCES</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Specification', href: '/spec' },
              { label: 'API Reference', href: '/docs' },
              { label: 'PyPI', href: 'https://pypi.org/project/ward-protocol/', ext: true },
              { label: 'GitHub', href: 'https://github.com/wflores9/ward-protocol', ext: true },
              { label: 'Discord', href: 'https://discord.gg/cGm9m5pEGK', ext: true },
            ].map(l => (
              <li key={l.label}>
                {l.ext
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#3d4f6e', textTransform: 'uppercase', marginBottom: 16 }}>LEGAL</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'wflores@wardprotocol.org', href: 'mailto:wflores@wardprotocol.org', ext: true },
            ].map(l => (
              <li key={l.label}>
                {l.ext
                  ? <a href={l.href} style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 13, color: '#6b7a99', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '20px 32px',
        borderTop: '1px solid rgba(168,197,232,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 12, color: '#3d4f6e' }}>© 2026 Ward Protocol</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#c8a94a' }}>ward_signed = False — always.</span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
