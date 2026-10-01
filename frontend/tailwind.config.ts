import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
        },
        lavender: "hsl(var(--lavender))",
        mint: "hsl(var(--mint))",
        peach: "hsl(var(--peach))",
        pink: "hsl(var(--pink))",
        sky: "hsl(var(--sky))",
        yellow: "hsl(var(--yellow))",
        module: {
          home: "hsl(var(--module-home))",
          tasks: "hsl(var(--module-tasks))",
          calendar: "hsl(var(--module-calendar))",
          habits: "hsl(var(--module-habits))",
          goals: "hsl(var(--module-goals))",
          journal: "hsl(var(--module-journal))",
          ai: "hsl(var(--module-ai))",
          insights: "hsl(var(--module-insights))",
          areas: "hsl(var(--module-areas))",
          health: "hsl(var(--module-health))",
          finance: "hsl(var(--module-finance))",
          learning: "hsl(var(--module-learning))",
          relationships: "hsl(var(--module-relationships))",
          settings: "hsl(var(--module-settings))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Life Area Colors
        area: {
          health: "hsl(var(--area-health))",
          relationships: "hsl(var(--area-relationships))",
          career: "hsl(var(--area-career))",
          finance: "hsl(var(--area-finance))",
          personal: "hsl(var(--area-personal))",
          fun: "hsl(var(--area-fun))",
          environment: "hsl(var(--area-environment))",
          spirituality: "hsl(var(--area-spirituality))",
          learning: "hsl(var(--area-learning))",
          contribution: "hsl(var(--area-contribution))",
        },
        // Pomodoro Colors
        pomodoro: {
          work: "hsl(var(--pomodoro-work))",
          break: "hsl(var(--pomodoro-break))",
          "long-break": "hsl(var(--pomodoro-long-break))",
        },
        // Status Colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        streak: "hsl(var(--streak))",
        "primary-ink": "hsl(var(--primary-ink))",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hero: "var(--shadow-hero)",
        fab: "var(--shadow-fab)",
        soft: "var(--shadow-soft)",
      },
      // Type scale (Visual Spec §Typography)
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.1", fontWeight: "700" }],
        "page-title": ["1.75rem", { lineHeight: "1.2", fontWeight: "700" }],
        section: ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        "card-title": ["0.9375rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.5" }],
        small: ["0.75rem", { lineHeight: "1.4" }],
        caption: ["0.6875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      // Radius (Visual Spec §Radius) — --radius = 20px
      borderRadius: {
        sm: "calc(var(--radius) - 12px)",  // 8px checkbox, menu item (giữ tương thích shadcn)
        icon: "calc(var(--radius) - 6px)", // 14px icon container
        md: "calc(var(--radius) - 4px)",   // 16px button / input
        lg: "var(--radius)",               // 20px small card
        xl: "calc(var(--radius) + 4px)",   // 24px large card
        "2xl": "calc(var(--radius) + 8px)", // 28px large card / app shell
        "3xl": "calc(var(--radius) + 12px)", // 32px app shell
        hero: "calc(var(--radius) + 16px)", // 36px hero card
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "streak-fire": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "mascot-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "streak-fire": "streak-fire 0.5s ease-in-out",
        "mascot-float": "mascot-float 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
