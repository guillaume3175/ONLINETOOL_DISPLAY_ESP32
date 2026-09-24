/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#1e1e2e',
        darkSidebar: '#181825',
        darkPanel: '#313244',
        accentBlue: '#89b4fa',
        accentGreen: '#a6e3a1',
        accentOrange: '#fab387'
      }
    },
  },
  plugins: [],
}
