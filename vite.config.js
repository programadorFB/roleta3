// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Garanta que o target seja este:
      '/login': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      },
      '/start-game': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      }
    }
  }
})