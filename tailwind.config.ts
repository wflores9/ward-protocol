import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   '#0d1f35',
        steel:  '#0d1f35',
        deep:   '#07111f',
        mid:    '#132236',
        ice:    '#a8c5e8',
        ice2:   '#6a9fd0',
        gold:   '#c8a94a',
        green:  '#00cc66',
        border: '#1a2e4a',
        dim:    '#3a5570',
        panel:  '#eef5fb',
        p2:     '#e2eef8',
        sub:    '#2e4a63',
      },
      fontFamily: {
        mono:      ['"Space Mono"', 'monospace'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
