import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        muted: "#65717f",
        line: "#d9e0e7",
        canvas: "#f4f6f8",
        accent: "#126b5f",
        amber: "#b7791f",
        danger: "#b42318"
      },
      boxShadow: {
        panel: "0 18px 48px rgba(23, 33, 43, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;
