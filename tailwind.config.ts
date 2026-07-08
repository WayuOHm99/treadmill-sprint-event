import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0C10',
        panel: '#14171D',
        panel2: '#1B1F27',
        line: '#262B34',
        hot: '#FF4D2E',
        gold: '#FFC53D',
        silver: '#C8CDD6',
        bronze: '#B87333',
        cream: '#F5F6F8',
        muted: '#8A8F9B',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,77,46,0.0)' },
          '30%': { boxShadow: '0 0 0 6px rgba(255,77,46,0.25)' },
        },
        streak: {
          '0%': { transform: 'translateX(-30%)', opacity: '0' },
          '15%': { opacity: '0.5' },
          '100%': { transform: 'translateX(130%)', opacity: '0' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1.1s ease-out 1',
        streak: 'streak 1.4s ease-out 1',
      },
    },
  },
  plugins: [],
};

export default config;
