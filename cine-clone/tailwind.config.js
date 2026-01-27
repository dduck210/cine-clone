/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Chỉ cần 1 dòng này là đủ dùng cho tất cả các độ đậm
        bromega: ["BROmega", "sans-serif"],
      },
    },
  },
  plugins: [],
};
