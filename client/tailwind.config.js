/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#f4f8f4',
          100: '#e5f0e6',
          200: '#cae1cc',
          300: '#a1cba5',
          400: '#71ae77',
          500: '#4d9254',
          600: '#3a7640',
          700: '#2f5e34',
          800: '#294b2c',
          900: '#233f26',
          950: '#0f2212',
        },
        sand: {
          50: '#fdfbf7',
          100: '#f9f6ed',
          200: '#f3ebd6',
          300: '#ebd9b5',
          400: '#e0c18d',
          500: '#d4a867',
        },
        earth: {
          500: '#8c6239',
          600: '#724b27',
          700: '#5c391b',
        },
        ayush: {
          ayurveda: '#15803d',
          yoga: '#0284c7',
          unani: '#d97706',
          siddha: '#7c3aed',
          homeopathy: '#059669',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
