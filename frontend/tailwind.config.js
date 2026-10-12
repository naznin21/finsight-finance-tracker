export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070b14',           // Deep navy background
        sidebar: '#080d1a',      // Sidebar dark navy
        card: '#0f172a',         // Charcoal / slate-900 card surface
        cardElevated: '#131e38', // Elevated card surface
        cardBorder: '#1e293b',   // Card border
        panel: '#0f172a',        // Panel alias
        panel2: '#16223d',       // Sub-panel / table head / input bg
        line: '#1e293b',         // Border line
        primary: '#6366f1',      // Violet / Indigo brand accent
        primaryHover: '#4f46e5',
        accent: '#6366f1',       // Violet accent
        accentCyan: '#06b6d4',   // Cyan highlights
        income: '#10b981',       // Emerald green
        expense: '#f43f5e',      // Rose / Crimson
        savings: '#8b5cf6',      // Purple
        warning: '#f59e0b',      // Amber
        muted: '#94a3b8',        // Secondary muted text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

