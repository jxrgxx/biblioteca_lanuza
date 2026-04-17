/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf2f3',
          100: '#f9e0e2',
          200: '#f3bfc4',
          300: '#e9939c',
          400: '#d8616e',
          500: '#b03a48',
          600: '#7F252E',
          700: '#6b1e27',
          800: '#57181f',
          900: '#461319',
        },
      },
    },
  },
  plugins: [],
};
