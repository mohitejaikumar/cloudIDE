/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customPurple1: '#540d6e',
        customPurple2: '#280a50',
        customThemeColor:'rgba(15, 0, 40, 1)'
      },
      keyframes: {
        gradientAnimation: {
          '0%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
          '100%': {
            'background-position': '0% 50%',
          },
        },
      },
      animation: {
        gradientAnimation: 'gradientAnimation 15s ease infinite',
      },
      backgroundImage: {
        gradientRadial: 'radial-gradient(circle at 50% 50%, #8A3EEB 0%, #4A00D1 30%, #20004E 50%, rgba(15, 0, 40, 1) 70%, rgba(0, 0, 0, 1) 100%)',
      },
      backgroundSize: {
        double: '200% 200%',
      },
    },
  },
  plugins: [],
}