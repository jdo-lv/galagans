// Retakes the screenshots in 16-pvt-test.md. App must be running on :8080 (mvn spring-boot:run).
// Run from the repo root: target/node/node docs/features/16-pvt-test.shots.mjs
// A test lasts 3 minutes, so runs use Chrome's virtual time (Emulation.setVirtualTimePolicy) to fast-forward.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/16-${name}.png`

// A fresh port per page, so a page never attaches to the previous, still-closing Chrome.
let port = 9780
async function open(hash, { height = 900, seed } = {}) {
  const page = await openPage(APP, { height, port: port++ })
  if (seed) {
    await page.evaluate(`new Promise((resolve, reject) => {
      const open = indexedDB.open('crew-health', 1)
      open.onerror = reject
      open.onsuccess = () => {
        const tx = open.result.transaction('checkIns', 'readwrite')
        const recordedAt = new Date(Date.now() - 2 * 60_000).toISOString()
        tx.objectStore('checkIns').put({ id: 'pvt-1', recordedAt, pvtMedianMs: ${seed}, pvtLapses: 1, pvtFalseStarts: 0, symptoms: [], syncStatus: 'synced' })
        tx.oncomplete = () => { open.result.close(); resolve() }
      }
    })`)
  }
  await page.evaluate(`location.hash = ${JSON.stringify(hash)}`)
  await page.reload()
  return page
}

// Runs the page's timers `ms` of virtual time ahead, as fast as the CPU allows.
async function advance(page, ms) {
  await page.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms })
  await page.sleep(Math.min(8000, 200 + ms / 25))
}

const respond = (page) =>
  page.evaluate(`document.querySelector('[aria-label="Respond"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)

const targetText = (page) => page.evaluate(`document.querySelector('[aria-label="Respond"]')?.innerText.trim()`)

// The wait is random (2–5 s) and the last RT stays on screen, so step until the text changes to a new counter.
async function waitForStimulus(page) {
  const before = await targetText(page)
  for (let i = 0; i < 60; i++) {
    await advance(page, 100)
    const now = await targetText(page)
    if (now !== before && /^\d+$/.test(now)) return
  }
}

async function respondAfterStimulus(page, rtMs) {
  await waitForStimulus(page)
  await advance(page, rtMs)
  await respond(page)
}

// Headless Chrome reports the page hidden after a long virtual-time run (seen at ~199 s), which the app
// rightly treats as "went to the background". Runs that must reach the end swallow that event.
const keepVisible = (page) =>
  page.evaluate(`document.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true)`)

let page = await open('#/', { height: 1500, seed: 268 })
await page.shot(img('home'))
await page.close()

page = await open('#/pvt')
await page.shot(img('start'))
await page.click('.button-primary', 100)
await page.send('Emulation.setVirtualTimePolicy', { policy: 'pause' })
await advance(page, 300)
await respond(page)
await page.sleep(200)
await page.shot(img('too-early'))
await page.close()

page = await open('#/pvt')
await keepVisible(page)
await page.click('.button-primary', 100)
await page.send('Emulation.setVirtualTimePolicy', { policy: 'pause' })
for (const rt of [262, 248, 281, 239, 301, 270, 255, 288, 266, 412, 259, 274]) await respondAfterStimulus(page, rt)
await waitForStimulus(page)
// A short budget barely moves the on-screen counter in virtual time; a longer one shows a typical mid-response value.
await advance(page, 2000)
await page.shot(img('running'))
await advance(page, 180_000)
await page.shot(img('result'))
await page.close()

page = await open('#/pvt')
await page.click('.button-primary', 100)
await page.send('Emulation.setVirtualTimePolicy', { policy: 'pause' })
await advance(page, 3000)
await page.evaluate(`Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange'))`)
// React only renders while virtual time runs.
await advance(page, 100)
await page.shot(img('background'))
await page.close()

page = await open('#/pvt')
await keepVisible(page)
await page.click('.button-primary', 100)
await page.send('Emulation.setVirtualTimePolicy', { policy: 'pause' })
// Taps every 1.9 s, always before the 2 s minimum wait, from an in-page timer so virtual time keeps it exact.
await page.evaluate(`setTimeout(() => {
  const tap = () => document.querySelector('[aria-label="Respond"]')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  tap()
  const id = setInterval(() => (performance.now() < 1000 + 176_700 + 1 ? tap() : clearInterval(id)), 1900)
}, 1000)`)
await advance(page, 185_000)
await page.shot(img('no-valid'))
await page.close()
