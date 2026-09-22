export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070b14',
        panel: '#0c1322',
        panel2: '#111a2c',
        line: '#1c2740',
        accent: '#22c1e6',
        accentDark: '#0ea5c4',
        income: '#22c55e',
        expense: '#f75c5c',
        muted: '#8a96ab',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
