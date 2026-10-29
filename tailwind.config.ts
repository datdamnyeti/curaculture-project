import type { Config } from 'tailwindcss';

export default {
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/contexts/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1b6984', dark: '#14536a', soft: '#dcedf3', ink: '#13232a' },
        // Diverging response scale, 1 (least favorable) to 6 (most). Deliberately not red/amber/green.
        scale: { 1: '#8a3b1f', 2: '#c0683f', 3: '#e8b596', 4: '#a9d3d6', 5: '#3f969e', 6: '#16595f' },
      },
    },
  },
  plugins: [],
} satisfies Config;
