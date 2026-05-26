/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        strava: { orange: '#FC4C02', dark: '#2D2D2D' },
      },
    },
  },
  plugins: [],
};
