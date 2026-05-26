import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "#F7F9FC",
        "bg-surface": "#FFFFFF",
        "border-subtle": "#E5EAF2",
        "text-primary": "#0F172A",
        "text-secondary": "#475569",
        "accent-primary": "#2563EB",
        "accent-soft": "#DBEAFE",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans JP", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 50px rgb(15 23 42 / 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

