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
        // Text hierarchy tokens (customer-facing)
        "tp-primary":   "#4A2545",
        "tp-secondary":  "#7A4A6E",
        "tp-muted":      "#7D5A7A",
        // Brand colours (kept for admin / utility use)
        berry: "#6B2547",
        plum: "#4A3050",
        rose: "#B5588C",
        "rose-deep": "#8B3D6B",
        "rose-light": "#D87BA8",
        "pink-soft": "#F4C0D1",
        lavender: "#C5B8E8",
        mint: "#B5D9C7",
        butter: "#FAC775",
        "border-pink": "#E8C8DD",
        // Candy palette (preserved)
        "candy-yellow": "#FBF8CC",
        "candy-peach": "#FDE4CF",
        "candy-pink": "#FFCFD2",
        "candy-blush": "#F1C0E8",
        "candy-lavender": "#CFBAF0",
        "candy-periwinkle": "#A3C4F3",
        "candy-sky": "#90DBF4",
        "candy-aqua": "#8EECF5",
        "candy-teal": "#98F5E1",
        "candy-mint": "#B9FBC0",
        "candy-border": "#CFBAF0",
        // Watercolor palette
        "wc-cream": "#FAF7F2",
        "wc-paper": "#F5F0E8",
        "wc-peach": "#F2C9A8",
        "wc-blush": "#E8A0B0",
        "wc-rose": "#D4788E",
        "wc-lavender": "#C4AED8",
        "wc-sky": "#A8C8E8",
        "wc-sage": "#A8C8A8",
        "wc-butter": "#F0D898",
        "wc-chocolate": "#8B5E3C",
        "wc-vanilla": "#D4A97A",
        "wc-ink": "#3D2B1F",
        "wc-muted": "#6B5C52",
      },
      fontFamily: {
        "eb-garamond": ["var(--font-eb-garamond)", "Georgia", "serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        "im-fell": ["var(--font-im-fell)", "Georgia", "serif"],
        "im-fell-sc": ["var(--font-im-fell-sc)", "Georgia", "serif"],
        caveat: ["var(--font-caveat)", "cursive"],
      },
      backgroundImage: {
        "page-gradient":
          "linear-gradient(160deg, #FAF7F2 0%, #F5F0E8 50%, #FAF7F2 100%)",
        "wc-gradient":
          "linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 40%, #FAF7F2 100%)",
      },
      boxShadow: {
        card: "0 2px 20px rgba(107, 92, 82, 0.10)",
        btn: "0 3px 0 #C4AED8",
        "wc-card": "0 4px 32px rgba(107, 92, 82, 0.12)",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
