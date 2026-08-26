import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette lifted from the Figma reference (orange accent,
        // deep charcoal sidebar, soft neutral surfaces).
        primary: {
          DEFAULT: '#FF5A1F',
          light: '#FFE7DA',
          dark: '#D9450F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F6F8',
          border: '#E6E8EC',
        },
        ink: {
          DEFAULT: '#1B1E27',
          soft: '#5B6270',
          faint: '#9AA0AC',
        },
        success: '#1FA971',
        danger: '#E5484D',
        highlight: '#FFD84D',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
