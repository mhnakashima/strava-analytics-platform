/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        strava: { orange: '#FC4C02', dark: '#2D2D2D' },
        // Semantic surface tokens — respond to .dark class via CSS vars
        'c-page':    'var(--c-page)',
        'c-card':    'var(--c-card)',
        'c-raised':  'var(--c-raised)',
        'c-subtle':  'var(--c-subtle)',
        'c-border':  'var(--c-border)',
        'c-ink':     'var(--c-ink)',
        'c-ink2':    'var(--c-ink2)',
        'c-ink3':    'var(--c-ink3)',
      },
      transitionProperty: {
        'width': 'width',
        'sidebar': 'width, transform',
      },
    },
  },
  plugins: [],
};
