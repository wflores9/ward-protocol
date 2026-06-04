import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        steel: '#14242b',
        'steel-2': '#1d3035',
        'steel-3': '#284047',
        navy: '#162832',
        deep: '#101d23',
        mid: '#243f45',
        gold: '#d4a93e',
        ice: '#b6d7ce',
        ice2: '#7fb4aa',
        'signal-green': '#00cc66',
        green: '#00cc66',
        border: '#284047',
        dim: '#78908b',
        panel: '#edf4f1',
        p2: '#dcebe6',
        sub: '#4f665f',
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
