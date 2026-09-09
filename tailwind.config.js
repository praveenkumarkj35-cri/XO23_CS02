/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#060911',
          900: '#0B0F1A',
          850: '#0F172A',
          800: '#141E33',
          750: '#1A2744',
          700: '#1E293B',
          600: '#334155',
          border: 'rgba(56, 189, 248, 0.15)',
          neonGreen: '#10B981',
          neonYellow: '#F59E0B',
          neonOrange: '#F97316',
          neonRed: '#EF4444',
          neonCyan: '#06B6D4',
          neonBlue: '#3B82F6'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)' },
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
