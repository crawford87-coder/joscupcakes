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
      },
      fontFamily: {
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        "im-fell": ["var(--font-im-fell)", "Georgia", "serif"],
        "im-fell-sc": ["var(--font-im-fell-sc)", "Georgia", "serif"],
      },
      backgroundImage: {
        "page-gradient":
          "linear-gradient(to bottom, #FFF5F8, #FBF0FA, #F0F5FB)",
      },
      boxShadow: {
        card: "0 2px 16px rgba(180, 120, 170, 0.15)",
        btn: "0 3px 0 #8B3D6B",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
