/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        grotesk: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        // Brand: "Nothing Red" — primary CTAs only
        brand: {
          DEFAULT: '#FF0000',
          hover: '#E60000',
          muted: '#3B0A0A',
        },
        // System failure — visually distinct from brand
        failure: {
          DEFAULT: '#EF4444',
          muted: '#7F1D1D',
        },
        // Non-fatal state (waiting, warnings)
        alert: {
          DEFAULT: '#EAB308',
          muted: '#713F12',
        },
        // Success
        success: {
          DEFAULT: '#22C55E',
          muted: '#14532D',
        },
        // Processing (merging, embedding)
        process: {
          DEFAULT: '#A855F7',
        },
        // Active/downloading
        active: {
          DEFAULT: '#3B82F6',
          muted: '#1E3A5F',
        },
        // Neutral surface ramp (mid-tone, not pure black)
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1F1F1F',
          900: '#171717',
          925: '#111111',
          950: '#0A0A0A',
        },
      },
    },
  },
  plugins: [],
}
