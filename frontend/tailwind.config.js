/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F5F0E8',
        'ivory-dark': '#EAE2D4',
        charcoal: '#1F1F1F',
        gold: {
          DEFAULT: '#C9A227',
          light: '#E2C763',
          dark: '#A8851B',
        },
        gray: {
          DEFAULT: '#666666',
          light: '#9C9C9C',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(31,31,31,0.08)',
        card: '0 4px 20px rgba(31,31,31,0.06)',
        lift: '0 16px 44px rgba(31,31,31,0.14)',
      },
    },
  },
  plugins: [],
};
