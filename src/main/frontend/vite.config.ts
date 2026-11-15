import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'
import type { Connect, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * `npm run dev:https` (DEV_HTTPS=1): the iPad only gives the page a microphone (voice, F25) over HTTPS.
 * The certificate comes from tools/dev-cert.sh, signed by a local CA the iPad is told to trust.
 */
function devHttps() {
  if (!process.env.DEV_HTTPS) return undefined
  const dir = join(homedir(), '.config', 'crew-health', 'dev-certs')
  const cert = join(dir, 'dev.pem')
  const key = join(dir, 'dev-key.pem')
  if (!existsSync(cert) || !existsSync(key)) throw new Error(`No dev certificate in ${dir}: run tools/dev-cert.sh first`)
  return { cert: readFileSync(cert), key: readFileSync(key) }
}

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

/**
 * Dev server only: importing from the @tabler/icons-react barrel makes Vite pre-bundle all ~6,000 icons, a 15 MB module
 * that keeps the iPad on an unstyled page for ~20 s over Wi-Fi. Each named icon is imported from its own file instead,
 * on one line so source maps keep their line numbers. The production build tree-shakes the barrel, so it's left alone.
 */
function tablerIconsPerFile(): Plugin {
  const barrel = /import\s*\{([^}]*)\}\s*from\s*["']@tabler\/icons-react["'];?/g
  return {
    name: 'tabler-icons-per-file',
    apply: 'serve',
    transform(code, id) {
      if (id.includes('/node_modules/') || !code.includes('@tabler/icons-react')) return undefined
      return code.replace(barrel, (_, names: string) =>
        names
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name && !name.startsWith('type '))
          .map((name) => {
            const [named, local = named] = name.split(/\s+as\s+/)
            // Icons live in dist/esm/icons/, helpers such as createReactComponent one folder up.
            const file = named.startsWith('Icon') ? `icons/${named}` : named
            return `import ${local} from '@tabler/icons-react/dist/esm/${file}.mjs';`
          })
          .join(' '),
      )
    },
  }
}

/**
 * Dev server only: CSS goes through Lightning CSS with the build's browser targets, so `light-dark()` (Safari 17.5+)
 * is rewritten for older Safari as the build already does when it minifies. Without it the demo iPad (Safari 16.5)
 * drops every colour token and shows an unstyled page.
 */
function lowerCssInDev(): Plugin {
  return { name: 'lower-css-in-dev', apply: 'serve', config: () => ({ css: { transformer: 'lightningcss' } }) }
}

export default defineConfig({
  plugins: [
    lowerCssInDev(),
    tablerIconsPerFile(),
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
  // Served icon by icon by tablerIconsPerFile() instead of pre-bundled whole.
  optimizeDeps: { exclude: ['@tabler/icons-react'] },
  server: {
    port: 5173,
    strictPort: true,
    // Listen on every interface so the demo iPad can open http(s)://<Mac IP>:5173, like Spring Boot on :8080.
    host: true,
    allowedHosts: ['.local'],
    https: devHttps(),
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
