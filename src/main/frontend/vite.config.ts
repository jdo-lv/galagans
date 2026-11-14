import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Crew Health Companion',
        short_name: 'CrewHealth',
        description: 'Offline-first daily health check-in for crew on space missions',
        theme_color: '#cfcfcf',
        background_color: '#cfcfcf',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    outDir: '../resources/static',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      // F25 voice host (voice-host/compose.yaml): LLM, speech-to-text, read-aloud.
      '/voice/llm': { target: 'http://localhost:8081', rewrite: (path) => path.replace(/^\/voice\/llm/, '') },
      '/voice/stt': { target: 'http://localhost:8082', rewrite: (path) => path.replace(/^\/voice\/stt/, '') },
      '/voice/tts': { target: 'http://localhost:8084', rewrite: (path) => path.replace(/^\/voice\/tts/, '') },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
