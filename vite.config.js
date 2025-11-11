// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redireciona chamadas de login para o server.js
      '/login': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      },
      // Redireciona chamadas do jogo para o server.js
      '/start-game': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      },
      // Redireciona chamadas da API (histórico) para o server.js
      '/api': {
        target: 'https://roleta-fuza.sortehub.online',
        changeOrigin: true,
      }
    }
  }
})