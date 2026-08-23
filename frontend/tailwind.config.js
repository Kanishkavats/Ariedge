// Vite will reload on config change
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c1d5ff',
          300: '#94b3ff',
          400: '#6089ff',
          500: '#3b63f7',
          600: '#2846db',
          700: '#2137b0',
          800: '#20308c',
          900: '#1e2c6f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
