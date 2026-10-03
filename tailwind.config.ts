import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B2545",
        mist: "#F3F8FC",
        brand: {
          50: "#EEF5FD", 100: "#DCE9F8", 200: "#B7D1F1", 300: "#85B2E6", 400: "#4F8DD8",
          500: "#1F6BC9", 600: "#0F52A8", 700: "#0B4087", 800: "#0B2F63", 900: "#0B2545",
        },
        aqua: {
          50: "#E8F8F9", 100: "#C6EEF1", 200: "#93DEE4", 400: "#2DBBC7",
          500: "#0FA3B1", 600: "#0B8794", 700: "#096B76",
        },
        rescue: { 50: "#FEF1F2", 100: "#FDE0E2", 200: "#FAC1C6", 500: "#D62839", 600: "#B81F2F", 700: "#951827" },
        ok: { 50: "#E7F6EE", 100: "#C9ECDA", 500: "#1E9E6A", 600: "#17855A", 700: "#126B49" },
        amber: { 50: "#FFF6E5", 100: "#FFE8BD", 500: "#E08A00", 700: "#9A5F00" },
      },
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Bricolage Grotesque"', "Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,37,69,.05), 0 10px 28px -14px rgba(11,37,69,.18)",
        lift: "0 2px 4px rgba(11,37,69,.06), 0 18px 40px -16px rgba(11,37,69,.28)",
      },
      keyframes: {
        ping2: { "0%": { transform: "scale(1)", opacity: ".6" }, "100%": { transform: "scale(2.6)", opacity: "0" } },
        rise: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        sheet: { "0%": { transform: "translateY(24px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
      animation: { ping2: "ping2 1.8s cubic-bezier(0,0,.2,1) infinite", rise: "rise .35s ease-out both", sheet: "sheet .25s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
