/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#003366',
        'brand-surface': '#F3F4F6',
        'brand-heading': '#0F172A',
        'brand-body': '#334155',
        'brand-border': '#CBD5E1',
        'brand-muted': '#94A3B8',
        'emergency-red': '#B91C1C',
        'success-green': '#15803D',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '4px',
        'md': '4px',
        'lg': '4px',
        'xl': '4px',
        '2xl': '4px',
        '3xl': '4px',
      },
    },
  },
  plugins: [],
}
