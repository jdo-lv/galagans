import { defineConfig } from 'vitest/config'
import type { Connect, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** The hidden device screen: /device/simulation and /device/websocket serve device.html (Spring Boot does the same). */
function deviceRoutes(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    if (req.url && /^\/device\/(simulation|websocket)\/?(\?.*)?$/.test(req.url)) req.url = '/device.html'
    next()
  }
  return {
    name: 'device-routes',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  }
}

export default defineConfig({
  plugins: [
    deviceRoutes(),
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
        // The simulator and the device screen are operator pages: never cached by, or answered with, the crew app.
        // iOS reads the launch images once, when the app is added to the home screen: no need to precache them.
        globIgnores: [
          'simulator.html', 'assets/simulator-*.js', 'assets/simulator-*.css',
          'device.html', 'assets/device-*.js', 'assets/device-*.css',
          'splash/**',
        ],
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /simulator\.html$/, /^\/device\//, /device\.html$/],
      },
    }),
  ],
  build: {
    outDir: '../resources/static',
    emptyOutDir: true,
    rolldownOptions: {
      input: { index: 'index.html', simulator: 'simulator.html', device: 'device.html' },
    },
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
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
