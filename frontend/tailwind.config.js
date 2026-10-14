/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnaval: {
          red: '#D90429',
          'red-dark': '#9D0208',
          'red-light': '#EF233C',
          yellow: '#FFB703',
          'yellow-light': '#FDDC22',
          blue: '#0077B6',
          'blue-dark': '#023E8A',
          'blue-light': '#90E0EF',
          green: '#2A9D8F',
          'green-dark': '#1E6F5C',
          orange: '#FB8500',
          gold: '#E0A906',
          dark: '#0F172A',
          'dark-card': '#1E293B',
          'dark-border': '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'carnaval-red': '0 4px 20px -2px rgba(217, 4, 41, 0.35)',
        'carnaval-yellow': '0 4px 20px -2px rgba(255, 183, 3, 0.35)',
        'carnaval-blue': '0 4px 20px -2px rgba(0, 119, 182, 0.35)',
        'carnaval-green': '0 4px 20px -2px rgba(42, 157, 143, 0.35)',
      }
    },
  },
  plugins: [],
}
