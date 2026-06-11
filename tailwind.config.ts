import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette — matches globals.css :root exactly
        navy:   '#0f2439',
        'navy-2': '#0d1f32',
        paper:  '#F9FAFC',
        gold:   '#b8973a',
        'gold-dim': 'rgba(184,151,58,0.12)',
        ice:    '#a7c5e5',
        'ice-dim': 'rgba(167,197,229,0.10)',
        green:  '#16a34a',
        'green-dim': 'rgba(22,163,74,0.10)',
        red:    '#dc2626',
        // Surfaces
        surface:  '#ffffff',
        border:   '#E4E9F2',
        'border-2': '#c8d9eb',
        // Text
        primary:   '#0f2439',
        secondary: '#5a7a99',
        muted:     '#8a9bb0',
        // Legacy aliases kept for HeroCard / FlowRunner / terms / privacy
        steel:  '#0f2439',   // was #14242b — now matches --steel in globals.css
        deep:   '#0d1f32',   // dark bg for code blocks
        dim:    '#8a9bb0',   // was #a9bdb8 — now matches --text-muted
        sub:    '#5a7a99',   // was #4f665f — now matches --text-secondary
        ice2:   '#7eb4d0',
        mist:   '#F9FAFC',
        mid:    '#E4E9F2',
        'signal-green': '#16a34a',
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
        display: ['"DM Sans"', 'sans-serif'],
      },
      keyframes: {
        'mesh-drift-1': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%':       { transform: 'translate(3%, -2%) scale(1.04)' },
          '66%':       { transform: 'translate(-2%, 3%) scale(0.97)' },
        },
        'mesh-drift-2': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '40%':       { transform: 'translate(-4%, 2%) scale(1.06)' },
          '80%':       { transform: 'translate(2%, -3%) scale(0.96)' },
        },
        'mesh-drift-3': {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%':       { transform: 'translate(2%, 4%) scale(1.03)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%':       { opacity: '1' },
        },
      },
      animation: {
        'mesh-1':     'mesh-drift-1 22s ease-in-out infinite',
        'mesh-2':     'mesh-drift-2 30s ease-in-out infinite',
        'mesh-3':     'mesh-drift-3 18s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'pulse-dot':  'pulse-dot 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass':       '0 1px 3px rgba(15,36,57,0.06), 0 0 0 1px rgba(228,233,242,0.8)',
        'glass-hover': '0 8px 32px rgba(15,36,57,0.12), 0 0 0 1px rgba(200,217,235,0.9)',
        'glass-glow':  '0 8px 32px rgba(15,36,57,0.12), 0 0 24px rgba(167,197,229,0.15)',
      },
    },
  },
  plugins: [],
}
export default config
