// Retakes the screenshots in 52-app-shell-home-variants.md and prints the shell's measured sizes (AC4, AC5).
// App must be running on :8080 (mvn spring-boot:run), or set APP_URL (the dev server on :5173 works too).
// Run from the repo root: target/node/node docs/features/52-app-shell-home-variants.shots.mjs
// CDP_PORT picks the first DevTools port (each page takes the next one). No device may publish on the relay meanwhile.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const img = (name) => `docs/features/img/52-${name}.png`
let port = Number(process.env.CDP_PORT ?? 9333)

// Local times on 14 Nov 2026: at 10:00 the 07:00–09:00 check-in is overdue.
const at = (h, m) => new Date(2026, 10, 14, h, m).toISOString()
/** A check-in at 07:30 and a PVT at 07:40: nothing owed, so Home is Nominal. */
const DONE = [
  { id: 'c1', recordedAt: at(7, 30), heartRateBpm: 62, spo2Percent: 97, sleepHours: 7, mood: 4, kss: 3, symptoms: [], symptomsAnswered: true, syncStatus: 'synced' },
  { id: 'p1', recordedAt: at(7, 40), pvtMedianMs: 268, pvtLapses: 0, pvtFalseStarts: 0, symptoms: [], syncStatus: 'synced' },
]

const put = (records) => `new Promise((resolve, reject) => {
  const open = indexedDB.open('crew-health')
  open.onerror = reject
  open.onsuccess = () => {
    const tx = open.result.transaction('checkIns', 'readwrite')
    for (const record of ${JSON.stringify(records)}) tx.objectStore('checkIns').put(record)
    tx.oncomplete = () => { open.result.close(); resolve() }
  }
})`

// The page's clock starts at 14 Nov 10:00 and keeps ticking.
const bootScript = `(() => {
  const Real = Date
  const offset = ${new Date(2026, 10, 14, 10, 0).getTime()} - Real.now()
  window.Date = class extends Real {
    constructor(...args) { args.length ? super(...args) : super(Real.now() + offset) }
    static now() { return Real.now() + offset }
  }
})()`

/** Opens `hash` at 14 Nov 10:00 with `seed` stored, in `theme` at `width` × `height`. */
async function open({ hash = '#/', theme = 'light', width = 1080, height = 810, seed = [] }) {
  const page = await openPage(APP, { width, height, port: port++ })
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await page.send('Network.enable')
  await page.send('Network.setBlockedURLs', { urls: ['*/api/*'] })
  // The first load created the check-in database; seed it, then reload into the screen.
  await page.evaluate(put(seed))
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)}); location.hash = ${JSON.stringify(hash)}`)
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: bootScript })
  await page.reload()
  // The launch splash fades out no earlier than 1.2 s after launch (ui/splash.ts).
  await page.sleep(600)
  return page
}

/** The shell as the browser lays it out: panel sizes, radii, gaps and who scrolls. */
const measure = (page) =>
  page.evaluate(`(() => {
    const css = (el, p) => getComputedStyle(el)[p]
    const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }
    const side = document.querySelector('.shell-side'), main = document.querySelector('.shell-main')
    const panes = [...document.querySelectorAll('.shell-pane')]
    return {
      viewport: [innerWidth, innerHeight],
      pageScrolls: document.documentElement.scrollHeight > innerHeight,
      side: { box: box(side), radius: css(side, 'borderTopLeftRadius'), overflowY: css(side, 'overflowY') },
      main: { box: box(main), radius: css(main, 'borderTopLeftRadius'), overflowY: css(main, 'overflowY') },
      gap: Math.round(main.getBoundingClientRect().left - side.getBoundingClientRect().right),
      panes: panes.map((p) => ({ box: box(p), overflowY: css(p, 'overflowY'), cardGap: css(p, 'rowGap') })),
    }
  })()`)

async function shot(options, name, before) {
  const page = await open(options)
  if (before) await before(page)
  await page.shot(img(name))
  return page
}

let page = await shot({}, 'todo')
console.log('1080 x 810, To do', JSON.stringify(await measure(page)))
await page.close()

await (await shot({}, 'todo-pvt', (p) => p.click('.todo-item:nth-child(2) .todo-item__head button'))).close()
await (await shot({ theme: 'dark' }, 'todo-dark')).close()
await (await shot({ seed: DONE }, 'nominal')).close()
await (await shot({ seed: DONE, theme: 'dark' }, 'nominal-dark')).close()
await (await shot({ hash: '#/stats' }, 'stats')).close()

page = await shot({ width: 800, height: 1024 }, 'todo-800')
console.log('800 x 1024, To do', JSON.stringify(await measure(page)))
await page.close()

page = await shot({ width: 390, height: 844 }, 'todo-390')
console.log('390 x 844, To do', JSON.stringify(await measure(page)))
await page.close()
