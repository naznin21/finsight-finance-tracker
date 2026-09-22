import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5055,
    proxy: {
      '/api': 'http://localhost:8082'
    }
  },
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true
  }
})
