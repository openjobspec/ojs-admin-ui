/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ojs: {
          available: '#3B82F6',
          scheduled: '#A78BFA',
          pending: '#94A3B8',
          active: '#F59E0B',
          completed: '#22C55E',
          retryable: '#F97316',
          cancelled: '#6B7280',
          discarded: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
