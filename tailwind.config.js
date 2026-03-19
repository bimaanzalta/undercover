/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace']
      },
      colors: {
        brutal: {
          yellow: '#FFE600',
          black: '#000000',
          white: '#FFFFFF',
          red: '#FF2020',
          blue: '#0000FF',
          green: '#00C800',
          pink: '#FF00FF',
          orange: '#FF6600'
        }
      },
      boxShadow: {
        'brutal-sm': '3px 3px 0 #000000',
        'brutal': '6px 6px 0 #000000',
        'brutal-lg': '10px 10px 0 #000000',
        'brutal-xl': '14px 14px 0 #000000',
        'brutal-yellow': '6px 6px 0 #FFE600',
        'brutal-red': '6px 6px 0 #FF2020',
        'brutal-blue': '6px 6px 0 #0000FF'
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px'
      },
      borderRadius: {
        'none': '0px'
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'slam': 'slam 0.3s ease-out',
        'reveal': 'reveal 0.6s ease-out',
        'pulse-brutal': 'pulse-brutal 1s ease-in-out infinite'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        slam: {
          '0%': { transform: 'scale(2) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
        },
        reveal: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' }
        },
        'pulse-brutal': {
          '0%, 100%': { boxShadow: '6px 6px 0 #000000' },
          '50%': { boxShadow: '8px 8px 0 #FFE600' }
        }
      }
    }
  },
  plugins: []
}
