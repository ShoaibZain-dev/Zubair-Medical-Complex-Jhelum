/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#1E90FF',
        'accent-yellow': '#FFD700',
        'bright-blue': '#00BFFF',
        'light-cream': '#F0E68C',
        'slate-blue': '#4682B4',
        medical: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FF',
          300: '#7CC2FF',
          400: '#38A2FF',
          500: '#1E90FF',
          600: '#0B72DF',
          700: '#0857AC',
          800: '#0A4A8E',
          900: '#0E3E73',
          950: '#0A274D',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
