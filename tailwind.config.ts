import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        surface: '#FFFFFF',
        primary: '#18181B',
        secondary: '#71717A',
        accent: '#DFFF00', // Volt
        border: '#E4E4E7',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['var(--font-chakra)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'lifted': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
export default config;
