/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-bg': '#060612',
        'glass-bg': 'rgba(6, 6, 18, 0.7)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'accent-teal': '#0ff4c6',
        'accent-violet': '#7b2ff7',
        'accent-pink': '#f72585',
        'accent-cyan': '#4cc9f0',
      },
      animation: {
        'float-slow': 'float 20s infinite ease-in-out',
        'float-medium': 'float 15s infinite ease-in-out',
        'float-fast': 'float 10s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(50px, -50px) scale(1.1)' },
          '50%': { transform: 'translate(-30px, 30px) scale(0.9)' },
          '75%': { transform: 'translate(30px, 50px) scale(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
