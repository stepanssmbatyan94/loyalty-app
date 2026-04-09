/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // --- Font families ---
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Be Vietnam Pro', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },

      // --- Design tokens (Material Design 3 + loyalty app) ---
      colors: {
        // Shadcn/Radix CSS variable tokens — kept for component compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Primary — blue
        primary: '#005f9e',
        'primary-container': '#1278c3',
        'on-primary': '#ffffff',
        'primary-fixed': '#d1e4ff',
        'primary-fixed-dim': '#9dcaff',
        'on-primary-fixed': '#001d35',
        'on-primary-fixed-variant': '#00497b',
        'inverse-primary': '#9dcaff',

        // Secondary — amber/gold
        secondary: '#785900',
        'secondary-container': '#fdc003',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#6c5000',
        'secondary-fixed': '#ffdf9e',
        'secondary-fixed-dim': '#fabd00',
        'on-secondary-fixed': '#261a00',
        'on-secondary-fixed-variant': '#5b4300',

        // Tertiary — green (earn transactions, progress bar)
        tertiary: '#006b29',
        'tertiary-container': '#008735',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#f7fff2',
        'tertiary-fixed': '#69ff87',
        'tertiary-fixed-dim': '#3ce36a',
        'on-tertiary-fixed': '#002108',
        'on-tertiary-fixed-variant': '#00531e',

        // Error — red (redeem transactions, locked state, expired timer)
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        // Background & surface
        background: '#f9f9fc',
        'on-background': '#1a1c1e',
        surface: '#f9f9fc',
        'on-surface': '#1a1c1e',
        'surface-variant': '#e2e2e5',
        'on-surface-variant': '#404751',
        'surface-bright': '#f9f9fc',
        'surface-dim': '#d9dadd',
        'surface-tint': '#0062a1',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f6',
        'surface-container': '#edeef1',
        'surface-container-high': '#e8e8eb',
        'surface-container-highest': '#e2e2e5',
        'inverse-surface': '#2f3133',
        'inverse-on-surface': '#f0f0f3',

        // Outline
        outline: '#707882',
        'outline-variant': '#c0c7d3',
      },

      // --- Border radius (design tokens from code.html) ---
      // DEFAULT=1rem, lg=2rem, xl=3rem, full=9999px
      // --radius CSS var is set to 1rem in globals.css for shadcn component compatibility
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',   // ~0.75rem
        md: 'var(--radius)',                // 1rem
        lg: '2rem',
        xl: '3rem',
        DEFAULT: '1rem',
        full: '9999px',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
