import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS vars (globals.css) so the theme toggle can swap palettes without touching components.
        void: "var(--c-void)",
        panel: "var(--c-panel)",
        "panel-raised": "var(--c-panel-raised)",
        line: "var(--c-line)",
        amber: {
          DEFAULT: "var(--c-amber)",
          dim: "var(--c-amber-dim)",
          glow: "var(--c-amber-glow)",
        },
        signal: {
          ok: "var(--c-signal-ok)",
          warn: "var(--c-amber)",
          bad: "var(--c-signal-bad)",
        },
        ink: {
          DEFAULT: "var(--c-ink)",
          dim: "var(--c-ink-dim)",
          faint: "var(--c-ink-faint)",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        bezel: "inset 0 1px 0 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(0,0,0,0.4)",
        glow: "0 0 12px rgba(255,178,0,0.25)",
      },
      backgroundImage: {
        scan: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
      },
    },
  },
  plugins: [],
};
export default config;
