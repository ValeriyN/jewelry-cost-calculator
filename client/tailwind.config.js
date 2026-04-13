/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#fdf9e7",
          100: "#faf0c0",
          200: "#f5e088",
          300: "#e8d087",
          400: "#d4af37",
          500: "#c9a520",
          600: "#b8960a",
          700: "#a07e08",
          800: "#886a06",
          900: "#6e5605",
        },
        surface: {
          950: "#05050a",
          900: "#0a0a0f",
          800: "#141419",
          700: "#1f1f24",
          600: "#252529",
          500: "#3a3a40",
          400: "#9494a0",
          300: "#b8b8c0",
          200: "#d4d4dc",
          100: "#e8e8ee",
        },
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        ".glow-gold":    { "box-shadow": "0 0 20px rgba(212,175,55,0.4)" },
        ".glow-gold-sm": { "box-shadow": "0 0 10px rgba(212,175,55,0.3)" },
      });
    },
  ],
}
