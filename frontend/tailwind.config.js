/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        accent: '#22d3ee',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        done: '#22c55e',
        'in-progress': '#f59e0b',
        planning: '#818cf8',
        blocked: '#ef4444',
        todo: '#eab308',
        'in_progress': '#6366f1',
        deadlines: '#a855f7',
        working: '#06b6d4',
        completed: '#16a34a',
        'risks_blockers': '#ef4444',
      }
    },
  },
  plugins: [],
}
