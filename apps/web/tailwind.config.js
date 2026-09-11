/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#020202',
        surface: {
          1: 'rgba(255, 255, 255, 0.03)',
          2: 'rgba(255, 255, 255, 0.055)',
          3: 'rgba(255, 255, 255, 0.08)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        'border-hi': 'rgba(255, 255, 255, 0.16)',
        text: '#f0f4f8',
        muted: 'rgba(200, 210, 225, 0.50)',
        dim: 'rgba(200, 210, 225, 0.28)',
        cyan: {
          DEFAULT: '#38d9f5',
          dim: 'rgba(56, 217, 245, 0.12)',
        },
        green: {
          DEFAULT: '#34d399',
          dim: 'rgba(52, 211, 153, 0.12)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          dim: 'rgba(245, 158, 11, 0.12)',
        },
        red: {
          DEFAULT: '#f87171',
          dim: 'rgba(248, 113, 113, 0.12)',
        },
        violet: {
          DEFAULT: '#a78bfa',
          dim: 'rgba(167, 139, 250, 0.12)',
        },
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
      },
      borderRadius: {
        'r-sm': '14px',
        'r-md': '20px',
        'r-lg': '28px',
      },
      boxShadow: {
        card: '0 8px 40px rgba(0, 0, 0, 0.55)',
        hover: '0 16px 60px rgba(0, 0, 0, 0.65)',
      },
    },
  },
  plugins: [],
};
