// Retakes the screenshots in 10-todays-routine.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/10-todays-routine.shots.mjs
// CDP_PORT picks another DevTools port when 9333 is taken.
import { openPage } from '../../tools/cdp.mjs'
import { saveCheckIn } from '../../tools/checkin-shots.mjs'

const img = (name) => `docs/features/img/10-${name}.png`
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { height: 1100, port: Number(process.env.CDP_PORT ?? 9333) })

let clockScript
// Sets the page's local clock to 2026-11-14 at h:m (it keeps ticking from there) and reloads.
const setClock = async (h, m = 0) => {
  if (clockScript) await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: clockScript })
  const target = new Date(2026, 10, 14, h, m).getTime()
  clockScript = (
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const Real = Date
        const offset = ${target} - Real.now()
        window.Date = class extends Real {
          constructor(...args) { args.length ? super(...args) : super(Real.now() + offset) }
          static now() { return Real.now() + offset }
        }
      })()`,
    })
  ).identifier
  await page.evaluate(`new Promise((resolve, reject) => {
    const open = indexedDB.open('crew-health', 1)
    open.onerror = reject
    open.onsuccess = () => {
      const tx = open.result.transaction('checkIns', 'readwrite')
      tx.objectStore('checkIns').clear()
      tx.oncomplete = () => { open.result.close(); resolve() }
    }
  })`)
  await page.reload()
}

await setClock(6, 30)
await page.shot(img('upcoming'))

await setClock(8)
await page.shot(img('due'))
await saveCheckIn(page, { mood: 3 }) // through the check-in steps since #29
await page.shot(img('done'))

await setClock(10)
await page.shot(img('missed'))

// Due in dark, switched with the header toggle (headless Chrome may start in either theme).
await setClock(8)
for (let i = 0; i < 2; i++) {
  await page.click('button[aria-label^="Switch to"]')
  await page.shot(img(`due-${await page.evaluate('document.documentElement.dataset.theme')}`))
}

// Phone width: the card stacks under Body systems, so scroll it into view.
await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true })
await page.sleep(300)
await page.evaluate(`[...document.querySelectorAll('h2')].find((h) => h.textContent === "Today's routine").scrollIntoView()`)
await page.sleep(300)
await page.shot(img('due-390'))

await page.close()
