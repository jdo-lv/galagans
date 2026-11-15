// Retakes the screenshots in 45-dot-display-status.md. Run from the repo root with Node 22 after `mvn clean verify`:
//   java -jar target/crew-health-companion-0.0.1-SNAPSHOT.jar          (APP_URL, default http://localhost:8080)
//   target/node/node docs/features/45-dot-display-status.shots.mjs
// Takes about 80 s: the stale and pct-only states wait out the display's 30 s freshness.
import { randomUUID } from 'node:crypto'
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080'
const CDP = Number(process.env.CDP_PORT ?? 9333)
const img = (name) => `docs/features/img/45-${name}.png`

// A socket that never opens: the page stays on "connecting" and sends nothing.
const NO_LINK = `window.WebSocket = class { constructor() { this.readyState = 0 } send() {} close() {} }`

async function open(url, { theme = 'light', height = 1000, offline = false } = {}) {
  const page = await openPage(url, { port: CDP, height })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  if (offline) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: NO_LINK })
  await page.reload()
  return page
}
// Headless Chrome doesn't run the theme transition, so it is switched off before toggling.
async function toggleTheme(page) {
  await page.evaluate(`document.head.insertAdjacentHTML('beforeend', '<style>* { transition: none !important }</style>')`)
  await page.click('button[aria-label^="Switch to"]', 1000)
}
const section = (name) => `[...document.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === ${JSON.stringify(name)})`
const click = (page, device, text) =>
  page.evaluate(`[...${section(device)}.querySelectorAll('button')].find((b) => b.textContent === ${JSON.stringify(text)}).click()`)
const DEVICES = ['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter']

/** Sends one pct-only frame, as tools/publish-dot-display.mjs does. */
async function publishPct(pct) {
  const socket = new WebSocket(`${APP.replace(/^http/, 'ws')}/ws/devices`)
  await new Promise((resolve) => (socket.onopen = resolve))
  socket.send(JSON.stringify({ topic: 'crew/a1/dot-display', payload: { id: randomUUID(), t: new Date().toISOString(), pct, src: 'synthetic' } }))
  await new Promise((resolve) => setTimeout(resolve, 300))
  socket.close()
}

// Waiting: the device link never opens, so no payload yet.
let page = await open(`${APP}/simulator.html`, { offline: true })
await page.shot(img('waiting'))
await page.close()

// The backend's health engine judges the simulator's frames and publishes on crew/a1/dot-display.
page = await open(`${APP}/simulator.html`)
await page.sleep(3000)
await page.shot(img('nominal'))

await click(page, 'Pulse oximeter', 'Check')
await page.sleep(3000)
await page.shot(img('check'))
await toggleTheme(page)
await page.shot(img('check-dark'))
await toggleTheme(page)

// One device stopped: the oximeter's last SpO₂ was Check; back to Nominal so the bracelet's heart rate is nominal.
await click(page, 'Pulse oximeter', 'Check')
await page.sleep(2000)
await click(page, 'Pulse oximeter', 'Stop')
await click(page, 'Pulse oximeter', 'Nominal')
await page.sleep(32_000)
await page.shot(img('stale'))

// Pct-only: every device stopped, the engine has nothing fresh after 30 s, then a stand-in frame.
for (const device of DEVICES.slice(1)) await click(page, device, 'Stop')
await page.sleep(32_000)
await publishPct(72)
await page.sleep(800)
await page.shot(img('pct-only'))
await page.close()

// Emergency, on a fresh page. The dot flashes at 1 Hz: page time is paused on its lit half, so this page is closed after.
page = await open(`${APP}/simulator.html`)
await click(page, 'Pulse oximeter', 'Emergency')
await page.sleep(3000)
const lit = () => page.evaluate(`!!document.querySelector('.sim-display__panel circle.dot--red')`)
while (!(await lit())) await page.sleep(20)
await page.send('Emulation.setVirtualTimePolicy', { policy: 'pause' })
await page.shot(img('emergency'))
await page.close()

// The device page is unchanged: the panel alone, filling the window.
page = await open(`${APP}/device/websocket`, { theme: 'dark', height: 600 })
await publishPct(72)
await page.sleep(800)
await page.shot(img('device-websocket'))
await page.close()
