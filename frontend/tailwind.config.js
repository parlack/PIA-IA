/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#F5F1E8',
        ink:   '#1C1B17',
        bone:  '#EDE6D6',
        moss: {
          50:  '#EEF3EF',
          100: '#D4E4D9',
          200: '#A8C9B1',
          300: '#7CAE89',
          400: '#508361',
          500: '#0E5037',
          600: '#0B3F2C',
          700: '#082E20',
        },
        ochre: {
          50:  '#FAF3E7',
          100: '#F0DEB5',
          400: '#C68A3B',
          500: '#B45309',
        },
        wine: {
          500: '#991B1B',
        },
      },
      borderRadius: {
        sharp: '2px',
        soft:  '6px',
      },
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
    },
  },
  plugins: [],
}
