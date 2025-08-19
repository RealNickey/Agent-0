/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "var(--midnight-blue)",
        accent: {
          blue: "var(--accent-blue)",
          "blue-active": "var(--accent-blue-active)",
          "blue-active-bg": "var(--accent-blue-active-bg)",
          "blue-headers": "var(--accent-blue-headers)",
          green: "var(--accent-green)",
          red: "var(--accent-red)",
        },
        neutral: {
          0: "var(--Neutral-00)",
          5: "var(--Neutral-5)",
          10: "var(--Neutral-10)",
          15: "var(--Neutral-15)",
          20: "var(--Neutral-20)",
          30: "var(--Neutral-30)",
          50: "var(--Neutral-50)",
          60: "var(--Neutral-60)",
          80: "var(--Neutral-80)",
          90: "var(--Neutral-90)",
        },
        gray: {
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          800: "var(--gray-800)",
          900: "var(--gray-900)",
          1000: "var(--gray-1000)",
        },
        green: {
          500: "var(--Green-500)",
          700: "var(--Green-700)",
        },
        blue: {
          30: "var(--blue-30)",
          400: "var(--Blue-400)",
          500: "var(--Blue-500)",
          800: "var(--Blue-800)",
        },
        red: {
          400: "var(--Red-400)",
          500: "var(--Red-500)",
          600: "var(--Red-600)",
          700: "var(--Red-700)",
        },
      },
      fontFamily: {
        mono: ['"Space Mono"', "monospace"],
        "google-sans": ['"Google Sans"', "sans-serif"],
      },
      animation: {
        "opacity-pulse": "opacity-pulse 3s ease-in infinite",
        hover: "hover 1.4s infinite alternate ease-in-out",
        pulse: "pulse-scale 1s infinite",
      },
      keyframes: {
        "opacity-pulse": {
          "0%": { opacity: "0.9" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.9" },
        },
        hover: {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-3.5px)" },
        },
        "pulse-scale": {
          from: { scale: "1 1" },
          to: { scale: "1.2 1.2" },
        },
      },
      transitionProperty: {
        width: "width",
        left: "left",
        "opacity-left": "opacity, left",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
