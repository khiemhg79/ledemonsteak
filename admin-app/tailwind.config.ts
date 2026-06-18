import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { brand: { black: "#1A1A1A", red: "#8B1A1A", gold: "#C9A84C" } } } },
  plugins: [],
}
export default config
