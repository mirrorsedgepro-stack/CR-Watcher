/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cr: {
          orange: '#F47521',
          orangeHover: '#FF8533',
          orangeMuted: 'rgba(244, 117, 33, 0.14)',
          dark: '#0B0C10',
          surface: '#141519',
          card: '#1B1D24',
          cardHover: '#232630',
          border: '#2A2E3B',
          gold: '#FAB818',
          teal: '#2ABDBB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
