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
          50: "#EAF2FF",
          100: "#D4E5FF",
          200: "#A8CAFF",
          300: "#7CB0FF",
          400: "#4D95FF",
          500: "#1554D1",
          600: "#1145A8",
          700: "#0E3680",
          800: "#102B5C",
          900: "#0B1F44",
        },
        secondary: {
          50: "#F5F8FF",
          100: "#EBEFF5",
          200: "#DCE5F2",
          300: "#BAC3D8",
          400: "#98A4BD",
          500: "#64748B",
          600: "#4A5568",
          700: "#3D4455",
          800: "#2D3340",
          900: "#102B5C",
        },
        success: {
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A3F4BE",
          300: "#6CE98E",
          400: "#34D058",
          500: "#168B45",
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
        onest: ["var(--font-onest)", "system-ui", "sans-serif"],
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