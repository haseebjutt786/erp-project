/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    // Dynamic color classes used in components
    { pattern: /^(bg|text|border)-(blue|green|red|yellow|purple|orange|teal|indigo|gray|brand)-(50|100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^(from|to|via)-(blue|green|red|yellow|purple|orange|teal|indigo|gray)-(400|500|600)$/ },
    'bg-gradient-orange', 'bg-gradient-blue', 'bg-gradient-green',
    'bg-gradient-purple', 'bg-gradient-red', 'bg-gradient-teal',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff3e9',
          100: '#ffe0c4',
          200: '#ffbe8a',
          300: '#ff9a50',
          400: '#ff7b0d',
          500: '#e86b00',
          600: '#c55a00',
          700: '#9e4800',
          800: '#7a3700',
          900: '#5a2800',
        },
        sidebar: {
          bg:     '#321740',
          hover:  '#3f1f53',
          active: '#55316b',
          border: 'rgba(255,255,255,0.08)',
          text:   'rgba(255,255,255,0.65)',
        },
        dark: {
          bg:      '#0f1117',
          surface: '#1a1d27',
          card:    '#1e2130',
          border:  '#2a2d3e',
        }
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        hover: '0 8px 24px rgba(0,0,0,0.12)',
        glow:  '0 0 20px rgba(255,123,13,0.25)',
      },
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #ff7b0d 0%, #ff9a50 100%)',
        'gradient-blue':   'linear-gradient(135deg, #466ae6 0%, #7b9ff5 100%)',
        'gradient-green':  'linear-gradient(135deg, #18a04b 0%, #4ecb71 100%)',
        'gradient-purple': 'linear-gradient(135deg, #7b4fa0 0%, #a97fc8 100%)',
        'gradient-red':    'linear-gradient(135deg, #eb0910 0%, #ff5c62 100%)',
        'gradient-teal':   'linear-gradient(135deg, #0096c7 0%, #48cae4 100%)',
        'gradient-sidebar':'linear-gradient(150deg, #321740 0%, #55316b 60%, #7b4fa0 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'skeleton':   'skeleton 1.5s ease-in-out infinite',
        'count-up':   'countUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        skeleton: { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        countUp:  { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
