import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EAF1FF",
          100: "#D4E3FF",
          200: "#A8C7FF",
          300: "#7CA8FF",
          400: "#4D8AFF",
          500: "#2457D6",
          600: "#1A46B8",
          700: "#14359A",
          800: "#102B5C",
          900: "#0D1F44",
        },
        secondary: {
          50: "#F5F7FB",
          100: "#EBEEF3",
          200: "#D6DBE5",
          300: "#B4BACB",
          400: "#9298AD",
          500: "#64748B",
          600: "#4A5568",
          700: "#3D4455",
          800: "#2D3340",
          900: "#172B4D",
        },
        success: {
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A3F4BE",
          300: "#6CE98E",
          400: "#34D058",
          500: "#16834A",
          600: "#126B3D",
          700: "#0F5430",
          800: "#0C3D23",
          900: "#092616",
        },
        warning: {
          50: "#FFFAEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D99116",
          600: "#B47612",
          700: "#8F5E10",
          800: "#704712",
          900: "#583614",
        },
        error: {
          50: "#FEF3F2",
          100: "#FEE4E2",
          200: "#FECDCA",
          300: "#FDA29B",
          400: "#F97066",
          500: "#DC4545",
          600: "#B42A2A",
          700: "#8F1F1F",
          800: "#6B1818",
          900: "#4E1313",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "card-elevated": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      transitionDuration: {
        "200": "200ms",
        "300": "300ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;