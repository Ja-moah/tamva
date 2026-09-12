/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#07130f",
        forest: "#123b2d",
        mint: "#75f0bd",
        cloud: "#f3f7f5",
      },
    },
  },
  plugins: [],
};
