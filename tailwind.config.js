/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60A5FA', // Light blue
          DEFAULT: '#3B82F6', // Medium blue
          dark: '#1E40AF', // Dark blue
        },
        background: {
          light: '#FFFFFF',
          dark: '#1A1B1E',
        },
        surface: {
          light: '#F3F4F6',
          dark: '#2C2E33',
        },
        text: {
          light: '#1F2937',
          dark: '#F3F4F6',
        }
      },
    },
  },
  plugins: [],
};
