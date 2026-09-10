/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        firewall: {
          dark: '#0a0d14',
          card: '#121824',
          border: '#1e293b',
          accent: '#ef4444',
          accentGlow: '#f87171',
          safe: '#10b981',
          warning: '#f59e0b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shield-glow': 'shieldGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shieldGlow: {
          '0%': { filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 24px rgba(239, 68, 68, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
