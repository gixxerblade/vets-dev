import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#141414",
        border: "#2a2a2a",
        text: "#e5e5e5",
        "text-muted": "#949494",
        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
        },
        success: {
          DEFAULT: "#22c55e",
          bg: "rgba(34, 197, 94, 0.1)",
          border: "rgba(34, 197, 94, 0.2)",
        },
        warning: {
          DEFAULT: "#eab308",
          bg: "rgba(234, 179, 8, 0.1)",
          border: "rgba(234, 179, 8, 0.2)",
        },
        info: {
          DEFAULT: "rgb(59, 130, 246)",
          bg: "rgba(59, 130, 246, 0.1)",
          border: "rgba(59, 130, 246, 0.2)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      maxWidth: {
        container: "800px",
      },
    },
  },
  plugins: [],
};

export default config;
