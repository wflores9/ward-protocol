import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        steel: '#080f1e',
        'steel-2': '#0d1828',
        'steel-3': '#111f35',
        navy: '#0d1f35',
        deep: '#07111f',
        mid: '#132236',
        gold: '#c8a94a',
        ice: '#a8c5e8',
        ice2: '#6a9fd0',
        'signal-green': '#00cc66',
        green: '#00cc66',
        border: '#1a2e4a',
        dim: '#3a5570',
        panel: '#eef5fb',
        p2: '#e2eef8',
        sub: '#2e4a63',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        display: ['"DM Sans"', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
