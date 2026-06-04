'use client';
import { useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { label: 'Protocol',  href: '/spec'      },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Build',     href: '/build'     },
  { label: 'Demo',      href: '/demo'      },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav" style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 76,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px',
      background: 'rgba(248,250,252,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(15,34,54,0.1)',
      boxShadow: '0 10px 30px rgba(15,34,54,0.08)',
    }}>

      {/* Brand */}
      <Link href="/" onClick={() => setOpen(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: '#102235',
          border: '1px solid rgba(15,34,54,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 900,
            fontSize: 22, color: '#e8edf5', letterSpacing: 0,
          }}>W</span>
          <div style={{
            position: 'absolute', bottom: 8, left: '50%',
            transform: 'translateX(-50%)',
            width: 16, height: 2, background: '#d4a93e', borderRadius: 1,
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 900,
            fontSize: 16, color: '#102235', letterSpacing: 0,
            lineHeight: 1.05,
          }}>WARD</span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 400,
            fontSize: 14, color: '#5c7184', letterSpacing: 0,
            lineHeight: 1.2, textTransform: 'uppercase',
          }}>Protocol</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <ul style={{
        alignItems: 'center', gap: 8,
        listStyle: 'none', margin: 0, padding: 0,
      }} className="hidden md:flex">
        {navLinks.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              style={{
                color: '#40596f',
                fontSize: 15,
                fontWeight: 650,
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: 8,
                letterSpacing: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#102235';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#40596f';
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}

        <li style={{ marginLeft: 8 }}>
          <a
            href="https://tally.so/r/VLDbBE"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#d4a93e',
              color: '#102235',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              letterSpacing: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#e5bd55';
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#d4a93e';
              el.style.transform = 'translateY(0)';
            }}
          >
            Get Started â†’
          </a>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button
        className="md:hidden"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#102235',
          fontSize: 28,
          padding: 10,
        }}
      >
        {open ? 'âœ•' : '≡'}
      </button>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden" style={{
          position: 'absolute',
          top: 76,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(248,250,252,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15,34,54,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                padding: '18px 28px',
                color: '#102235',
                fontSize: 17,
                fontWeight: 650,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(15,34,54,0.08)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ padding: '16px 24px' }}>
            <a
              href="https://tally.so/r/VLDbBE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#c8a94a',
              color: '#102235',
              padding: '14px 24px',
                borderRadius: 8,
                fontWeight: 700,
              fontSize: 16,
                textDecoration: 'none',
              }}
            >
              Get Started â†’
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
