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
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)'
        },
        background: {
          DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
          card: 'rgb(var(--color-background-card) / <alpha-value>)',
          dark: 'rgb(var(--color-background-dark) / <alpha-value>)'
        },
        charcoal: {
          DEFAULT: 'rgb(var(--color-charcoal) / <alpha-value>)',
          light: 'rgb(var(--color-charcoal-light) / <alpha-value>)',
          dark: 'rgb(var(--color-charcoal-dark) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          light: 'rgb(var(--color-success-light) / <alpha-value>)',
          dark: 'rgb(var(--color-success-dark) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          light: 'rgb(var(--color-warning-light) / <alpha-value>)',
          dark: 'rgb(var(--color-warning-dark) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          light: 'rgb(var(--color-danger-light) / <alpha-value>)',
          dark: 'rgb(var(--color-danger-dark) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'Noto Sans SC', 'sans-serif'],
        display: ['BacherDemo', 'Oswald', 'Inter', 'sans-serif'],
        note: ['"Segoe Print"', '"Comic Sans MS"', 'BacherDemo', 'cursive']
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
