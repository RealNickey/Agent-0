/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // New modern color scheme
        primary: {
          50: '#f0f4ff',
          100: '#e1eaff',
          200: '#c3d4ff',
          300: '#a5beff',
          400: '#87a8ff',
          500: '#6D8EC5', // Main primary color
          600: '#5a7aa8',
          700: '#47668b',
          800: '#34526e',
          900: '#213e51',
          950: '#0e2a34',
        },
        secondary: {
          50: '#fef4ed',
          100: '#fde8d5',
          200: '#fbd1aa',
          300: '#f9ba7f',
          400: '#f7a354',
          500: '#D3622C', // Main secondary color
          600: '#b85524',
          700: '#9d481c',
          800: '#823b14',
          900: '#672e0c',
          950: '#4c2104',
        },
        accent: {
          50: '#fefbec',
          100: '#fef7d3',
          200: '#fdefaa',
          300: '#fce781',
          400: '#fbdf58',
          500: '#F0C845', // Main accent color
          600: '#d4ad3a',
          700: '#b8922f',
          800: '#9c7724',
          900: '#805c19',
          950: '#64410e',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#212842', // Main dark color
          950: '#0f172a',
        },
        // Legacy colors for backward compatibility
        midnight: 'var(--midnight-blue)',
        'accent-legacy': {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          red: 'var(--accent-red)'
        },
        'neutral-legacy': {
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
        },
        // Shadcn/ui compatible colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 0.6s ease-in-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: []
};
