import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#0a0a1f',
          purple: '#6b21ff',
          blue: '#1e40ff',
          cyan: '#00f0ff',
          pink: '#ff00ea',
        },
      },
    },
  },
  plugins: [],
}
export default config
