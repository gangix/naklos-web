/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d7ff',
          200: '#80bdff',
          300: '#4da3ff',
          400: '#1a89ff',
          500: '#0070f3',
          600: '#005cc0',
          700: '#00488d',
          800: '#00345a',
          900: '#002027',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        urgent:    { 50:'#fef2f2', 100:'#fee2e2', 500:'#dc2626', 600:'#b91c1c', 700:'#991b1b' },
        attention: { 50:'#fffbeb', 100:'#fef3c7', 200:'#fde68a', 500:'#d97706', 600:'#b45309', 700:'#92400e' },
        info:      { 50:'#f0f9ff', 100:'#e0f2fe', 500:'#0284c7', 600:'#0369a1', 700:'#075985' },
        confirm:   { 500:'#16a34a', 600:'#15803d', 700:'#166534' },
        warm:      { DEFAULT:'#FAFAF7', 50:'#FAFAF7', 100:'#F4F3ED' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Instrument Serif', 'ui-serif', 'serif'],
      },
      boxShadow: {
        card:      '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.04)',
        cardHover: '0 4px 12px rgb(15 23 42 / 0.06), 0 2px 4px rgb(15 23 42 / 0.04)',
        actionBar: '0 -8px 24px -4px rgb(15 23 42 / 0.10), 0 -2px 6px -1px rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
}
