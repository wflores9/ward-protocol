'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#101d23',
      borderTop: '1px solid rgba(182,215,206,0.12)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '64px 32px 40px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48,
      }} className="footer-grid">
        {/* Brand */}
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: '#172f37',
              border: '1px solid rgba(182,215,206,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 21, color: '#e8edf5' }}>W</span>
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, background: '#d4a93e', borderRadius: 1 }} />
            </div>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: 16, color: '#e8edf5', letterSpacing: 0 }}>WARD</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, fontSize: 14, color: '#aec0bc', letterSpacing: 0, textTransform: 'uppercase' }}>Protocol</div>
            </div>
          </Link>
          <p style={{ fontSize: 14, color: '#aec0bc', lineHeight: 1.7, marginBottom: 8, maxWidth: 260 }}>
            Deterministic default resolution for on-chain lending.
          </p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#d4a93e', marginTop: 12 }}>
            ward_signed = False — always.
          </p>
        </div>

        {/* Product */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 0, color: '#78908b', textTransform: 'uppercase', marginBottom: 16 }}>PRODUCT</div>
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
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 0, color: '#78908b', textTransform: 'uppercase', marginBottom: 16 }}>RESOURCES</div>
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
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 0, color: '#78908b', textTransform: 'uppercase', marginBottom: 16 }}>LEGAL</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'wflores@wardprotocol.org', href: 'mailto:wflores@wardprotocol.org', ext: true },
            ].map(l => (
              <li key={l.label}>
                {l.ext
                  ? <a href={l.href} style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</a>
                  : <Link href={l.href} style={{ fontSize: 14, color: '#aec0bc', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#aec0bc')}>{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '20px 32px',
        borderTop: '1px solid rgba(182,215,206,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 14, color: '#78908b' }}>© 2026 Ward Protocol</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#d4a93e' }}>ward_signed = False — always.</span>
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
