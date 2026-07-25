import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { alphaTab } from '@coderline/alphatab-vite'

export default defineConfig({
  plugins: [react(), alphaTab()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      // P2 JVM OmrApiServer (default port 8080)
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
