import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          // Amber-gold — reads as the brand's "yellow" while keeping enough
          // contrast for text (600/700) and white-on-button use (DEFAULT).
          DEFAULT: "#D97706",
          foreground: "#ffffff",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#D97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        accent: {
          DEFAULT: "#2E86AB",
          foreground: "#ffffff",
          50: "#f0f8fb",
          100: "#d1ecf4",
          200: "#a3d9e9",
          300: "#66bdd6",
          400: "#2E86AB",
          500: "#226d8e",
          600: "#1a5572",
          700: "#133e55",
          800: "#0d2838",
          900: "#07131c",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface:  "hsl(var(--surface))",
        // Brand accent trio (from the logo) — landing page only for now.
        "brand-red": {
          DEFAULT: "#E53935",
          50:  "#fdecec",
          100: "#fbd0cf",
          400: "#ef5350",
          500: "#e53935",
          600: "#d32f2f",
          700: "#b71c1c",
        },
        "brand-yellow": {
          DEFAULT: "#FBC02D",
          50:  "#fff9e6",
          100: "#fff2c2",
          400: "#fdd835",
          500: "#fbc02d",
          600: "#f9a825",
        },
        "brand-green": {
          DEFAULT: "#43A047",
          50:  "#eaf6ea",
          100: "#c8e6c9",
          400: "#66bb6a",
          500: "#4caf50",
          600: "#43a047",
        },
        success:  "hsl(var(--success))",
        warning:  "hsl(var(--warning))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-bg))",
          border:  "hsl(var(--sidebar-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "count-up": "count-up 0.6s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
