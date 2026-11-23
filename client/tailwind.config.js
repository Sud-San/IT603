/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        panel: '#1F2937',
        gold: '#D4A017',
        cream: '#F9FAFB',
        mute: '#9CA3AF',
        ok: '#16A34A',
        warn: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Outfit', 'Noto Sans Gujarati', 'sans-serif'],
        display: ['Cormorant Garamond', 'Noto Sans Gujarati', 'serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
