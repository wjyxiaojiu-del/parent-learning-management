/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 60px rgba(31, 41, 55, 0.08)',
      },
    },
  },
  plugins: [],
};
