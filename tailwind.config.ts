import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border:  "var(--border)",
        input:   "var(--input)",
        ring:    "var(--ring)",
        // Named brand colors for direct use in class names
        "dark-green":   "#07403B",
        "cotton":       "#F9F4E0",
        "sunny-yellow": "#FFE404",
        "light-pink":   "#F693C1",
        "olive":        "#95A733",
        "brand-orange": "#FE7040",
        "soft-yellow":  "#FFF077",
        "popping-pink": "#F55CB1",
        "light-blue":   "#90EBD2",
        "near-black":   "#1a1a1a",
      },
      fontFamily: {
        arinoe: ["Arinoe", "serif"],
        abel:   ["Abel", "system-ui", "sans-serif"],
        // Make Abel the default sans so all body text inherits it
        sans:   ["Abel", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
