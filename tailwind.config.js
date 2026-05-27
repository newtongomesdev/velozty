/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#050508',
        neoncard: '#101018',
        volt: '#C6FF00',
        hyperpink: '#FF2BD6',
        mutedgray: '#A1A1AA',
      },
      boxShadow: {
        'glow-volt': '0 0 15px rgba(198, 255, 0, 0.25)',
        'glow-pink': '0 0 15px rgba(255, 43, 214, 0.25)',
        'glow-volt-lg': '0 0 25px rgba(198, 255, 0, 0.45)',
        'glow-pink-lg': '0 0 25px rgba(255, 43, 214, 0.45)',
      }
    },
  },
  plugins: [],
}
