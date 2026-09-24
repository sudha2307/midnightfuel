import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#121212",
        "surface-raised": "#1a1a1a",
        "surface-card": "#181818",
        border: "#262626",
        "border-glow": "rgba(255, 122, 0, 0.25)",
        primary: {
          DEFAULT: "#FF7A00",
          hover: "#FF9029",
          glow: "rgba(255, 122, 0, 0.4)",
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#ff7a00",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        accent: {
          cyan: "#00F0FF",
          amber: "#F59E0B",
          yellow: "#FBBF24",
          green: "#10B981",
          red: "#EF4444",
        },
        muted: {
          DEFAULT: "#71717A",
          foreground: "#A1A1AA",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Outfit", "system-ui", "sans-serif"],
        heading: ["var(--font-outfit)", "Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(255, 122, 0, 0.35)",
        "glow-lg": "0 0 50px -10px rgba(255, 122, 0, 0.45)",
        "glow-cyan": "0 0 25px -5px rgba(0, 240, 255, 0.35)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "neon-glow": "neonGlow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        neonGlow: {
          "0%": { boxShadow: "0 0 10px rgba(255, 122, 0, 0.3)" },
          "100%": { boxShadow: "0 0 25px rgba(255, 122, 0, 0.7)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
