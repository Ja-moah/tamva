/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#07130f",
        obsidian: "#050d0a",
        surface: "#0c1f17",
        card: "#0f281e",
        forest: "#123b2d",
        mint: "#75f0bd",
        emeraldPrimary: "#00d084",
        gold: "#f59e0b",
        amberSoft: "#fbbf24",
        cloud: "#f3f7f5",
        cardLight: "#ffffff",
      },
    },
  },
  plugins: [],
};
