/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: 'var(--midnight-blue)',
        accent: {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          red: 'var(--accent-red)'
        },
        neutral: {
          0: 'var(--Neutral-00)',
          5: 'var(--Neutral-5)',
          10: 'var(--Neutral-10)',
          15: 'var(--Neutral-15)',
          20: 'var(--Neutral-20)',
          30: 'var(--Neutral-30)',
          50: 'var(--Neutral-50)',
          60: 'var(--Neutral-60)',
          80: 'var(--Neutral-80)',
          90: 'var(--Neutral-90)'
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
