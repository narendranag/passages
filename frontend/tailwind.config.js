/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#0f0f1a",
          800: "#1a1a2e",
          700: "#16213e",
          600: "#1a3a5c",
        },
      },
    },
  },
  plugins: [],
};
