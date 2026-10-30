import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    // jsdom cần thiết để render React components trong môi trường Node.js
    environment: 'jsdom',
    // Load @testing-library/jest-dom matchers (toBeInTheDocument, v.v.)
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
})
