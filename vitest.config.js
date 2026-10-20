import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom', // 👈 antes era 'jsdom'
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.js'],
      // thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
})