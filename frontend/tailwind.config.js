/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#0F4C81',
          lightBlue: '#EBF3FA',
          orange: '#FF9933',
          green: '#138808',
          subtle: '#F8FAFC',
          card: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(15, 76, 129, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        card: '0 2px 10px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
