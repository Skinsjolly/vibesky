import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VibeSky palette: deep space navy + electric violet + aurora green
        sky: {
          void: '#0A0B14',
          deep: '#0F1020',
          mid: '#141528',
          surface: '#1A1C35',
          elevated: '#20234A',
          border: '#2A2D5A',
          muted: '#3D4180',
        },
        vibe: {
          50: '#F0EEFF',
          100: '#E2DDFF',
          200: '#C4BBFF',
          300: '#A799FF',
          400: '#8A77FF',
          500: '#6C55FF',
          600: '#5540E0',
          700: '#3F2DB8',
          800: '#2A1C8F',
          900: '#160E6B',
        },
        aurora: {
          50: '#EDFFF8',
          100: '#D5FFF0',
          200: '#ADFEE2',
          300: '#70FBCC',
          400: '#35F0B0',
          500: '#0ED494',
          600: '#05AB78',
          700: '#068762',
          800: '#096A4F',
          900: '#095742',
        },
        pulse: {
          500: '#FF6B8A',
          600: '#E8527A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'float-in': 'floatIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'vibe-glow': 'radial-gradient(ellipse at top, #6C55FF15 0%, transparent 60%)',
        'aurora-glow': 'radial-gradient(ellipse at bottom right, #0ED49415 0%, transparent 60%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(108,85,255,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
