/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bromega: ["BROmega", "sans-serif"],
      },
      keyframes: {
        fadeIn:      { from: { opacity: "0" },                               to: { opacity: "1" } },
        fadeUp:      { from: { opacity: "0", transform: "translateY(12px)" },to: { opacity: "1", transform: "translateY(0)" } },
        fadeSlideIn: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        modalIn:     { from: { opacity: "0", transform: "scale(0.93)" },     to: { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        fadeIn:      "fadeIn 0.4s ease forwards",
        fadeUp:      "fadeUp 0.5s ease forwards",
        fadeSlideIn: "fadeSlideIn 0.3s ease forwards",
        modalIn:     "modalIn 0.2s ease forwards",
      },
    },
  },
  plugins: [],
};
