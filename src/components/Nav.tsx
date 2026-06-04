python3 - << 'PYEOF'
content = """'use client'
import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Protocol',  href: '/spec'      },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Build',     href: '/build'     },
  { label: 'Demo',      href: '/demo'      },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      background: 'rgba(8,15,30,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(168,197,232,0.08)',
    }}>

      {/* Brand */}
      <Link href="/" onClick={() => setOpen(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(168,197,232,0.08)',
          border: '1px solid rgba(168,197,232,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 900,
            fontSize: 15, color: '#a8c5e8', letterSpacing: '-0.5px',
          }}>W</span>
          <div style={{
            position: 'absolute', bottom: 5, left: '50%',
            transform: 'translateX(-50%)',
            width: 10, height: 1.5, background: '#c8a94a', borderRadius: 1,
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 900,
            fontSize: 13, color: '#e8edf5', letterSpacing: '0.08em',
            lineHeight: 1.1,
          }}>WARD</span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 400,
            fontSize: 10, color: '#6b7a99', letterSpacing: '0.06em',
            lineHeight: 1.1, textTransform: 'uppercase',
          }}>Protocol</span>
        </div>
      </Link>

      {/* Desktop links */}
      <ul style={{
        display: 'flex', alignItems: 'center', gap: 4,
        listStyle: 'none', margin: 0, padding: 0,
      }} className="hidden md:flex">
        {navLinks.map(l => (
          <li key={l.href}>
            <Link 
              href={l.href} 
              style={{
                color: '#6b7a99', 
                fontSize: 14, 
                fontWeight: 500,
                textDecoration: 'none', 
                padding: '6px 12px',
                borderRadius: 6, 
                letterSpacing: '-0.01em',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e8edf5'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7a99'}
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
              background: '#e8edf5', 
              color: '#080f1e',
              padding: '8px 18px', 
              borderRadius: 8,
              fontWeight: 700, 
              fontSize: 13, 
              textDecoration: 'none',
              letterSpacing: '-0.01em', 
              transition: 'all 0.15s ease',
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 4,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#ffffff'
              el.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#e8edf5'
              el.style.transform = 'translateY(0)'
            }}
          >
            Get Started →
          </a>
        </li>
      </ul>

      {/* Mobile hamburger */}
      <button className="md:hidden"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#a8c5e8', fontSize: 22, padding: 8,
        }}>
        {open ? '✕' : '≡'}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden" style={{
          position: 'absolute', top: 64, left: 0, right: 0, zIndex: 50,
          background: 'rgba(8,15,30,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168,197,232,0.08)',
          display: 'flex', flexDirection: 'column',
        }}>
          {navLinks.map(l => (
            <Link 
              key={l.href} 
              href={l.href} 
              onClick={() => setOpen(false)}
              style={{
                padding: '16px 24px', 
                color: '#a8c5e8', 
                fontSize: 15,
                fontWeight: 500, 
                textDecoration: 'none',
                borderBottom: '1px solid rgba(168,197,232,0.06)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ padding: '16px 24px'
