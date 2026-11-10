import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OriginOS 6 Natural Color Palette
        originos: {
          bg: "#F8FAFC",
          bgDark: "#0B1120",
          card: "#FFFFFF",
          cardDark: "#151E32",
          cardDarkElevated: "#1E2A44",
          text: "#1E293B",
          textMuted: "#64748B",
          textDark: "#F8FAFC",
          textDarkMuted: "#94A3B8",
          blue: "#2563EB",
          blueLight: "#DBEAFE",
          violet: "#7C3AED",
          violetLight: "#EDE9FE",
          green: "#10B981",
          amber: "#F59E0B",
          rose: "#EF4444",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "originos-sm": "0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)",
        "originos": "0 10px 25px -3px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.03)",
        "originos-lg": "0 20px 35px -4px rgba(0, 0, 0, 0.07), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
        "originos-dark": "0 10px 30px -4px rgba(0, 0, 0, 0.4)",
        "originos-float": "0 15px 35px -5px rgba(37, 99, 235, 0.25)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Gautami",
          "Mandali",
          "Noto Sans Telugu",
          "Noto Sans Devanagari",
          "Noto Sans Tamil",
          "Noto Sans Kannada",
          "Noto Sans Malayalam",
          "Noto Sans Bengali",
          "Arial",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
