/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#060612",
        teal: {
          400: "#0ff4c6",
          500: "#0cd1aa"
        },
        violet: {
          400: "#7b2ff7",
          500: "#6021c7"
        },
        pink: {
          400: "#f72585",
          500: "#d31e73"
        },
        cyan: {
          400: "#4cc9f0"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
