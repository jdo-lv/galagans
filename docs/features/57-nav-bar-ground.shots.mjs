// Retakes the screenshots in 57-nav-bar-ground.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL
// (`npm run preview` works too: /api is blocked anyway, the packets are seeded).
// Run from the repo root: target/node/node docs/features/57-nav-bar-ground.shots.mjs
// CDP_PORT picks the first DevTools port (each page takes the next one).
import { writeFileSync } from 'node:fs'
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/57-${name}.png`
let port = Number(process.env.CDP_PORT ?? 9333)

// Local times on 14 Nov 2026, like the issue's tests.
const at = (h, m) => new Date(2026, 10, 14, h, m).toISOString()
const item = (key, state) => ({ key, label: key, unit: '', state })

const PACKETS = [
  {
    id: 'old',
    builtAt: at(7, 0),
    oneWayDelayMs: 845_000,
    note: 'Headache since wake-up',
    items: [item('spo2', 'nominal'), item('heartRate', 'check')],
    state: 'sent',
    sentAt: at(7, 1),
  },
  { id: 'mid', builtAt: at(7, 45), oneWayDelayMs: 845_000, note: '', items: [item('spo2', 'nominal'), item('heartRate', 'nominal')], state: 'sent', sentAt: at(7, 50) },
  { id: 'new', builtAt: at(7, 58), oneWayDelayMs: 845_000, note: '', items: [item('spo2', 'nominal')], state: 'queued' },
]

const put = (db, store, records) => `new Promise((resolve, reject) => {
  const open = indexedDB.open(${JSON.stringify(db)}, 1)
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction(${JSON.stringify(store)}, 'readwrite')
    for (const record of ${JSON.stringify(records)}) tx.objectStore(${JSON.stringify(store)}).put(record)
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`

// The page's clock starts at 14 Nov 08:00 and keeps ticking, so the 07:50 packet is still in transit.
const bootScript = `(() => {
  const Real = Date
  const offset = ${new Date(2026, 10, 14, 8, 0).getTime()} - Real.now()
  window.Date = class extends Real {
    constructor(...args) { args.length ? super(...args) : super(Real.now() + offset) }
    static now() { return Real.now() + offset }
  }
})()`

/** Opens `hash` with `packets` stored, at 14 Nov 08:00, in `theme` at `width` × `height`. */
async function open({ hash, theme, width = 1280, height = 800, packets = [] }) {
  const page = await openPage(APP, { width, height, port: port++ })
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  // No ground station: the queued packet stays queued, whichever server serves the app.
  await page.send('Network.enable')
  await page.send('Network.setBlockedURLs', { urls: ['*/api/*'] })
  // The first load created the packet database; seed it, then reload into the screen.
  await page.evaluate(put('crew-health-packets', 'packets', packets))
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)}); location.hash = ${JSON.stringify(hash)}`)
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: bootScript })
  await page.reload()
  // The launch splash fades out no earlier than 1.2 s after launch (ui/splash.ts).
  await page.sleep(600)
  return page
}

async function shot(options, name) {
  const page = await open(options)
  await page.shot(img(name))
  await page.close()
}

/** The bar's strip only, for the close-ups. */
async function shotBar(page, path) {
  const strip = await page.evaluate(`(() => { const r = document.querySelector('.nav-bar').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })()`)
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...strip, scale: 1 } })
  writeFileSync(path, Buffer.from(data, 'base64'))
}

/** Sizes measured in the running app, for the feature doc's manual checks. */
const measure = (page) =>
  page.evaluate(`(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    const items = [...document.querySelectorAll('.nav-bar__items > li > *')]
    return { pill: box(document.querySelector('.nav-bar__items')), items: items.map((el) => [el.textContent || el.getAttribute('aria-label'), ...box(el)]), page: document.documentElement.scrollWidth }
  })()`)

await shot({ hash: '#/', theme: 'dark' }, 'home')
await shot({ hash: '#/add', theme: 'light' }, 'add')
await shot({ hash: '#/symptoms', theme: 'dark' }, 'symptoms')
await shot({ hash: '#/ground', theme: 'light' }, 'ground-empty')
await shot({ hash: '#/ground', theme: 'light', packets: PACKETS }, 'ground')
await shot({ hash: '#/ground', theme: 'dark', packets: PACKETS }, 'ground-dark')
await shot({ hash: '#/check-in', theme: 'dark' }, 'check-in')
await shot({ hash: '#/packet', theme: 'light', packets: PACKETS }, 'packet')

await shot({ hash: '#/', theme: 'light', width: 390, height: 844 }, 'home-390')
await shot({ hash: '#/add', theme: 'light', width: 390, height: 844 }, 'add-390')
await shot({ hash: '#/symptoms', theme: 'dark', width: 390, height: 844 }, 'symptoms-390')
await shot({ hash: '#/ground', theme: 'dark', width: 390, height: 844 }, 'ground-empty-390')
await shot({ hash: '#/ground', theme: 'light', width: 390, height: 844, packets: PACKETS }, 'ground-390')

// Close-ups of the strip: the + current with its ring on the check-in, and keyboard focus on Ground.
let page = await open({ hash: '#/check-in', theme: 'light' })
await shotBar(page, img('bar-check-in'))
console.log('1280 light', JSON.stringify(await measure(page)))
await page.evaluate(`document.querySelector('.nav-bar a[href="#/add"]').focus()`)
for (const type of ['keyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
await page.sleep(300)
if (!(await page.evaluate(`document.activeElement.matches('.nav-bar a[href="#/ground"]:focus-visible')`))) throw new Error('Ground has no keyboard focus: Tab must skip Rewards')
await shotBar(page, img('bar-focus'))
await page.close()

page = await open({ hash: '#/add', theme: 'dark', width: 375, height: 812 })
await shotBar(page, img('bar-375'))
console.log('375 dark', JSON.stringify(await measure(page)))
// The current + has its own ring; under keyboard focus the focus ring (--color-focus, the text colour) replaces it.
await page.evaluate(`document.querySelector('.nav-bar a[href="#/statistics"]').focus()`)
for (const type of ['keyDown', 'keyUp']) await page.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
await page.sleep(300)
const ring = await page.evaluate(`(() => {
  const add = document.activeElement
  return { focused: add.matches('.nav-bar__add[aria-current="page"]:focus-visible'), outline: getComputedStyle(add).outlineColor, text: getComputedStyle(document.body).color }
})()`)
if (!ring.focused || ring.outline !== ring.text) throw new Error(`The current + shows no focus ring: ${JSON.stringify(ring)}`)
await shotBar(page, img('bar-375-focus'))
await page.close()
