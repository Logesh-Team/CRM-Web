/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F6F3',
        surface: '#FFFFFF',
        border: '#E3E1DA',
        'text-primary': '#1A1A18',
        'text-secondary': '#5A5A56',
        blue: {
          DEFAULT: '#185FA5',
          bg: '#E6F1FB',
        },
        green: {
          DEFAULT: '#3B6D11',
          bg: '#EAF3DE',
        },
        amber: {
          DEFAULT: '#BA7517',
          bg: '#FAEEDA',
        },
        red: {
          DEFAULT: '#A32D2D',
          bg: '#FCEBEB',
        },
        purple: {
          DEFAULT: '#534AB7',
          bg: '#EEEDFE',
        },
        teal: {
          DEFAULT: '#0F6E56',
          bg: '#E1F5EE',
        },
        gray: {
          DEFAULT: '#5A5A56',
          bg: '#F0EEE9',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
