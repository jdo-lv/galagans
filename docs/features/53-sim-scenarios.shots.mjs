// Retakes the screenshots in 53-sim-scenarios.md. Run from the repo root with Node 22 after `mvn clean verify`:
//   java -jar target/crew-health-companion-0.0.1-SNAPSHOT.jar          (APP_URL, default http://localhost:8080)
//   target/node/node docs/features/53-sim-scenarios.shots.mjs
// Takes about 30 s: step 2 starts 20 s after the check.
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080'
const CDP = Number(process.env.CDP_PORT ?? 9333)
const img = (name) => `docs/features/img/53-${name}.png`

// STUB_LINK=1 (e.g. against `npm run preview`, which serves no /ws): a socket that opens and drops every frame, so the tiles show values.
const STUB = `window.WebSocket = class { constructor() { this.readyState = 1; setTimeout(() => this.onopen?.()) } send() {} close() {} }`

async function open(theme) {
  const page = await openPage(`${APP}/simulator.html`, { port: CDP, height: 1960 })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  if (process.env.STUB_LINK) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: STUB })
  await page.reload()
  return page
}

const FAULT = '.sim-scenario input[type=checkbox]'

let page = await open('light')
await page.sleep(1500)
await page.shot(img('unchecked'))

await page.click(FAULT, 3000)
await page.shot(img('step-1'))

await page.sleep(19_000)
await page.shot(img('step-2'))
await page.close()

page = await open('dark')
await page.click(FAULT, 21_000)
await page.shot(img('step-2-dark'))
await page.close()
