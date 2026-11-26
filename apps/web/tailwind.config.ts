import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F111A', surface: '#181B28', line: '#272B3F',
        violet: { DEFAULT: '#7C3AED', 600: '#6D28D9' }, cyan: { DEFAULT: '#06B6D4' },
        ink: '#F8FAFC', mute: '#9CA3AF', ok: '#10B981', warn: '#F59E0B', danger: '#EF4444',
      },
      backgroundImage: { brand: 'linear-gradient(90deg,#7C3AED,#06B6D4)' },
      fontFamily: { sans: ['Inter', 'Roboto', 'system-ui', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
