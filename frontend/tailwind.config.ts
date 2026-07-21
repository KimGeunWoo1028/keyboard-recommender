import type { Config } from "tailwindcss";

const withAlpha = (cssVar: string) => `rgb(var(${cssVar}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withAlpha("--background"),
        foreground: withAlpha("--foreground"),
        card: {
          DEFAULT: withAlpha("--card"),
          foreground: withAlpha("--card-foreground"),
        },
        primary: {
          DEFAULT: withAlpha("--primary"),
          foreground: withAlpha("--primary-foreground"),
        },
        secondary: {
          DEFAULT: withAlpha("--secondary"),
          foreground: withAlpha("--secondary-foreground"),
        },
        muted: {
          DEFAULT: withAlpha("--muted"),
          foreground: withAlpha("--muted-foreground"),
        },
        border: withAlpha("--border"),
        ring: withAlpha("--ring"),

        /* Cyber-Artisan — use via bg-ca-primary, text-ca-on-surface, etc. */
        ca: {
          surface: withAlpha("--ca-surface"),
          "surface-dim": withAlpha("--ca-surface-dim"),
          "surface-bright": withAlpha("--ca-surface-bright"),
          "surface-container-lowest": withAlpha("--ca-surface-container-lowest"),
          "surface-container-low": withAlpha("--ca-surface-container-low"),
          "surface-container": withAlpha("--ca-surface-container"),
          "surface-container-high": withAlpha("--ca-surface-container-high"),
          "surface-container-highest": withAlpha("--ca-surface-container-highest"),
          "on-surface": withAlpha("--ca-on-surface"),
          "on-surface-variant": withAlpha("--ca-on-surface-variant"),
          "inverse-surface": withAlpha("--ca-inverse-surface"),
          "inverse-on-surface": withAlpha("--ca-inverse-on-surface"),
          outline: withAlpha("--ca-outline"),
          "outline-variant": withAlpha("--ca-outline-variant"),
          "surface-tint": withAlpha("--ca-surface-tint"),
          primary: withAlpha("--ca-primary"),
          "on-primary": withAlpha("--ca-on-primary"),
          "primary-container": withAlpha("--ca-primary-container"),
          "on-primary-container": withAlpha("--ca-on-primary-container"),
          "inverse-primary": withAlpha("--ca-inverse-primary"),
          secondary: withAlpha("--ca-secondary"),
          "on-secondary": withAlpha("--ca-on-secondary"),
          "secondary-container": withAlpha("--ca-secondary-container"),
          "on-secondary-container": withAlpha("--ca-on-secondary-container"),
          tertiary: withAlpha("--ca-tertiary"),
          "on-tertiary": withAlpha("--ca-on-tertiary"),
          "tertiary-container": withAlpha("--ca-tertiary-container"),
          "on-tertiary-container": withAlpha("--ca-on-tertiary-container"),
          error: withAlpha("--ca-error"),
          "on-error": withAlpha("--ca-on-error"),
          "error-container": withAlpha("--ca-error-container"),
          "on-error-container": withAlpha("--ca-on-error-container"),
          background: withAlpha("--ca-background"),
          "on-background": withAlpha("--ca-on-background"),
          "surface-variant": withAlpha("--ca-surface-variant"),
          "viz-emerald": withAlpha("--ca-viz-emerald"),
          "viz-gold": withAlpha("--ca-viz-gold"),
          base: withAlpha("--ca-base"),
        },
      },
      fontFamily: {
        headline: ["var(--font-headline)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        label: ["var(--font-headline)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "ca-display-lg": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "ca-headline-lg": ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "ca-headline-md": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "ca-body-lg": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "400" }],
        "ca-body-md": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "ca-label-sm": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        btn: "var(--radius-btn)",
      },
      maxWidth: {
        content: "42rem",
        ca: "90rem",
      },
      spacing: {
        "ca-gutter": "1.5rem",
        "ca-margin": "2.5rem",
        "ca-margin-mobile": "1rem",
      },
      boxShadow: {
        "ca-glow": "none",
        "ca-elevated": "0 1px 2px rgb(0 0 0 / 0.45), 0 8px 24px rgb(0 0 0 / 0.35)",
      },
      backdropBlur: {
        ca: "20px",
        "ca-elevated": "40px",
      },
    },
  },
  plugins: [],
};

export default config;
