import type { Config } from 'tailwindcss';

export default {
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/contexts/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        // One brand colour, used for buttons, links and highlights only.
        brand: { DEFAULT: '#1b6984', dark: '#14536a', soft: '#e6f1f4', ink: '#0b1418' },
        // Neutral surfaces and lines for design J.
        canvas: '#f7f8f9',
        line: '#e2e5e8',
        // Diverging response scale, 1 (least favorable) to 6 (most). Deliberately not red/amber/green.
        // Used only inside results, never for decoration.
        scale: { 1: '#8a3b1f', 2: '#c0683f', 3: '#e8b596', 4: '#a9d3d6', 5: '#3f969e', 6: '#16595f' },
      },
      letterSpacing: { display: '-0.04em', heading: '-0.025em' },
    },
  },
  plugins: [],
} satisfies Config;
