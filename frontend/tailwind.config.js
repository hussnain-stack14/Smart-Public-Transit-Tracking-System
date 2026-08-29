/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:        "#101B33",
        "navy-deep": "#0A1226",
        cream:       "#F4F1E9",
        amber:       "#F2A93B",
        "amber-hover": "#FFBD5C",
        teal:        "#2F6F68",
        "teal-soft": "#7FBFB6",
        coral:       "#E4572E",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)",    "sans-serif"],
        mono:    ["var(--font-mono)",    "monospace"],
      },
    },
  },
  plugins: [],
};
