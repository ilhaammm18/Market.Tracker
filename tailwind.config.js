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
        background: "#040914",
        "bg-deep": "#040914",
        "bg-surface": "#0A192F",
        "bg-card": "rgba(10, 25, 47, 0.72)",
        "gold-amber": "#F5B700",
        "gold-glow": "#FDB813",
        "emerald-market": "#10B981",
        "rose-market": "#F43F5E",
        "cyan-node": "#06B6D4",
        navy: {
          950: "#040914",
          900: "#061024",
          850: "#0A192F",
          800: "#0F264A",
          700: "#1E3A8A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 45s linear infinite",
        "spin-reverse-slow": "spin-reverse 60s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 40s linear infinite",
        glow: "glow 3s ease-in-out infinite alternate",
      },
      keyframes: {
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { opacity: 0.35, transform: "scale(1)" },
          "100%": { opacity: 0.65, transform: "scale(1.05)" },
        },
      },
      boxShadow: {
        gold: "0 0 25px -5px rgba(245, 183, 0, 0.3)",
        cyan: "0 0 25px -5px rgba(6, 182, 212, 0.3)",
        emerald: "0 0 20px -5px rgba(16, 185, 129, 0.3)",
        rose: "0 0 20px -5px rgba(244, 63, 94, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};

