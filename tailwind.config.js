/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#151412',
          light: '#2A2723',
          dark: '#0E0D0C'
        },
        secondary: {
          DEFAULT: '#726A60',
          light: '#8C8174',
          dark: '#4B463F'
        },
        accent: {
          DEFAULT: '#8B5B1F',
          light: '#B46A3C',
          dark: '#6F4618'
        },
        background: {
          DEFAULT: '#F7F2E8',
          card: '#FFFAF2',
          dark: '#E7DDCF'
        },
        charcoal: {
          DEFAULT: '#151412',
          light: '#4D4840',
          dark: '#0E0D0C'
        },
        success: {
          DEFAULT: '#5E7463',
          light: '#718B77',
          dark: '#405344'
        },
        warning: {
          DEFAULT: '#9B7442',
          light: '#B88F57',
          dark: '#76552E'
        },
        danger: {
          DEFAULT: '#9A4E45',
          light: '#B8665B',
          dark: '#743630'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'Inter', 'sans-serif']
      },
      boxShadow: {
        premium: '0 18px 50px -28px rgba(55, 39, 23, 0.35)',
        'premium-hover': '0 24px 70px -32px rgba(55, 39, 23, 0.45)',
        'accent-glow': '0 10px 24px -14px rgba(139, 91, 31, 0.55)'
      }
    },
  },
  plugins: [],
}
