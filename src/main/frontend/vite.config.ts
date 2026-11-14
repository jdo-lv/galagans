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
        // The simulator is an operator page: never cached by, or answered with, the crew app.
        globIgnores: ['simulator.html', 'assets/simulator-*.js', 'assets/simulator-*.css'],
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /simulator\.html$/],
      },
    }),
  ],
  build: {
    outDir: '../resources/static',
    emptyOutDir: true,
    rolldownOptions: {
      input: { index: 'index.html', simulator: 'simulator.html' },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
