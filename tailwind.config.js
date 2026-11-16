/** @type {import('tailwindcss').Config} */
const tokens = require('./theme/tokens');

// Every value comes from theme/tokens.js (which reads design/tailwind.theme.json).
// Add nothing here by hand: change the token module instead.
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [k, `${v}px`])),
      spacing: Object.fromEntries(Object.entries(tokens.spacing).map(([k, v]) => [k, `${v}px`])),
      fontFamily: {
        sans: [tokens.fontFamily.regular],
        regular: [tokens.fontFamily.regular],
        medium: [tokens.fontFamily.medium],
        semibold: [tokens.fontFamily.semibold],
      },
      fontSize: tokens.source.fontSize,
    },
  },
  plugins: [],
};
