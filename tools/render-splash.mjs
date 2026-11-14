// Renders the launch splash in src/main/frontend/index.html, light theme, into the iPad launch images and the
// home-screen icons in public/, and writes the matching apple-touch-startup-image tags into index.html.
// Run from the repo root after npm ci (or a full build), then rebuild: target/node/node tools/render-splash.mjs
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { openPage } from './cdp.mjs'

const FRONTEND = resolve('src/main/frontend')
const INDEX = join(FRONTEND, 'index.html')
const PUBLIC = join(FRONTEND, 'public')

// Portrait CSS size of each iPad screen, all 2x. iOS shows a launch image only when its media query matches exactly.
const IPADS = [
  [744, 1133], // iPad mini (6th gen, A17 Pro)
  [768, 1024], // iPad mini 5, iPad 9.7"
  [810, 1080], // iPad 10.2" (7th–9th gen)
  [820, 1180], // iPad (10th gen, A16), iPad Air 10.9" and 11"
  [834, 1112], // iPad Air (3rd gen), iPad Pro 10.5"
  [834, 1194], // iPad Pro 11" (1st–4th gen)
  [834, 1210], // iPad Pro 11" (M4)
  [1024, 1366], // iPad Pro 12.9", iPad Air 13"
  [1032, 1376], // iPad Pro 13" (M4)
]
const SCALE = 2
const ICONS = [['apple-touch-icon.png', 180], ['pwa-192.png', 192], ['pwa-512.png', 512]]

const splash = readFileSync(INDEX, 'utf8').match(/<!-- splash:start -->([\s\S]*?)<!-- splash:end -->/)[1]
const page = `<!doctype html>
<html lang="en" data-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="/node_modules/@fontsource/inter/latin-400.css">
<link rel="stylesheet" href="/node_modules/@fontsource/inter/latin-500.css">
<link rel="stylesheet" href="/src/ui/theme/tokens.css">
<link rel="stylesheet" href="/src/ui/theme/base.css">
</head><body>${splash}</body></html>`

const TYPES = { '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  if (path === '/') return response.writeHead(200, { 'content-type': 'text/html' }).end(page)
  const file = join(FRONTEND, path)
  if (!file.startsWith(FRONTEND + sep) || !TYPES[extname(file)]) return response.writeHead(404).end()
  try {
    response.writeHead(200, { 'content-type': TYPES[extname(file)] }).end(readFileSync(file))
  } catch {
    response.writeHead(404).end()
  }
})
await new Promise((listening) => server.listen(0, '127.0.0.1', listening))

const browser = await openPage(`http://127.0.0.1:${server.address().port}/`, { settleMs: 800 })
const render = async (width, height, scale, file) => {
  await browser.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
  await browser.evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))')
  await browser.shot(file)
}

mkdirSync(join(PUBLIC, 'splash'), { recursive: true })
const links = []
for (const [width, height] of IPADS) {
  for (const orientation of ['portrait', 'landscape']) {
    const [w, h] = orientation === 'portrait' ? [width, height] : [height, width]
    const href = `/splash/apple-splash-${w * SCALE}x${h * SCALE}.png`
    await render(w, h, SCALE, join(PUBLIC, href))
    links.push(
      `<link rel="apple-touch-startup-image" media="(device-width: ${width}px) and (device-height: ${height}px) and ` +
        `(-webkit-device-pixel-ratio: ${SCALE}) and (orientation: ${orientation})" href="${href}" />`,
    )
  }
}

// Icons: the ring alone, centred, at the share of the icon the first icons used.
await browser.evaluate(`document.head.insertAdjacentHTML('beforeend', '<style>' +
  '.splash-wordmark, .splash-credit { display: none } .splash-brand { inset: 0; justify-content: center }' +
  '.splash-ring { width: 68vmin; height: 68vmin }</style>')`)
for (const [file, size] of ICONS) await render(size, size, 1, join(PUBLIC, file))

await browser.close()
server.close()

const index = readFileSync(INDEX, 'utf8')
writeFileSync(
  INDEX,
  index.replace(
    /(<!-- apple-splash:start -->)[\s\S]*?(\n\s*<!-- apple-splash:end -->)/,
    `$1\n${links.map((link) => `    ${link}`).join('\n')}$2`,
  ),
)
console.log(`${links.length} launch images and ${ICONS.length} icons written to ${PUBLIC}`)
