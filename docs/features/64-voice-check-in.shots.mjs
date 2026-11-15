// Screenshots of the check-in run by voice (#64). Needs the Vite dev server (:5173) and voice-host/compose.yaml running.
// Run from the repo root with Node 22: target/node/node docs/features/64-voice-check-in.shots.mjs
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173/'
let port = 9460

// The oximeter's heart rate 63 (2 min ago) and SpO₂ 97 (1 min ago), as the check-in prefills them (#55).
const SEED_DEVICE = `new Promise((resolve, reject) => {
  const open = indexedDB.open('crew-health-observations', 1)
  open.onupgradeneeded = () => open.result.createObjectStore('observations', { keyPath: 'id' })
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction('observations', 'readwrite')
    for (const [ago, indicator, value, unit] of [[125, 'heartRateBpm', 63, 'bpm'], [65, 'spo2Percent', 97, '%']]) {
      tx.objectStore('observations').put({
        resourceType: 'Observation', id: 'oximeter:shot-' + indicator, status: 'final', code: { text: indicator },
        valueQuantity: { value, unit }, effectiveDateTime: new Date(Date.now() - ago * 1000).toISOString(),
        device: { display: 'oximeter · synthetic' },
      })
    }
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`

/** Opens the check-in with the device readings stored; the microphone is granted (headless denies it by default). */
async function open({ theme = 'dark', width = 1280, height = 900 }) {
  const page = await openPage(APP, { width, height, port: port++ })
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)}); location.hash = '#/check-in'`)
  await page.evaluate(SEED_DEVICE)
  await page.send('Browser.grantPermissions', { origin: new URL(APP).origin, permissions: ['audioCapture'] })
  // Headless Chrome sometimes never ends audio; screenshots don't show sound, so playback ends at once.
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `HTMLMediaElement.prototype.play = function () { setTimeout(() => this.dispatchEvent(new Event('ended')), 50); return Promise.resolve() }`,
  })
  await page.reload()
  for (let i = 0; i < 40 && (await page.evaluate(`!!document.getElementById('splash')`)); i++) await page.sleep(250)
  return page
}

const text = (page) => page.evaluate(`document.body.innerText`)

async function waitFor(page, what, ok) {
  for (let i = 0; i < 120; i++) {
    if (ok(await text(page))) return
    await page.sleep(250)
  }
  throw new Error(`"${what}" never showed; page: ${(await text(page)).replace(/\n+/g, ' | ')}`)
}

/** Taps the mic as a user would (read-aloud needs a gesture): voice asks step 1, then the pill shows "Voice: listening". */
async function voiceOn(page) {
  await page.send('Runtime.evaluate', { expression: `document.querySelector('button[aria-label="Voice control"]').click()`, userGesture: true })
  await waitFor(page, 'Voice: listening', (t) => t.includes('Voice: listening'))
}

const click = (page, label) => page.evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(label)}).click()`)

// Step 1 prefilled with the tag, voice listening (dark, 1280 px).
let page = await open({})
try {
  await waitFor(page, 'prefilled 63', (t) => t.includes('oximeter · synthetic'))
  await voiceOn(page)
  await page.shot('docs/features/img/64-step1-listening.png')
  // A tap on "Save check-in" ends voice without a word: the completion screen, no pill.
  for (let i = 0; i < 5; i++) {
    await click(page, 'Next →')
    await page.sleep(150)
  }
  await click(page, 'Save check-in')
  await waitFor(page, 'completion', (t) => t.includes('Check-in complete') && !t.includes('Voice:'))
  await page.shot('docs/features/img/64-complete-voice-off.png')
} finally {
  await page.close()
}

// Phone, light, step 1 with the pill.
page = await open({ theme: 'light', width: 390 })
try {
  await waitFor(page, 'prefilled 63', (t) => t.includes('oximeter · synthetic'))
  await voiceOn(page)
  await page.shot('docs/features/img/64-step1-listening-390.png')
} finally {
  await page.close()
}
