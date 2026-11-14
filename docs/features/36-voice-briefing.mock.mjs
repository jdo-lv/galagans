// Mock for the voice control issue (#36): Home with voice on, while the briefing is spoken.
// Needs the dev server (:5173) and voice-host/compose.yaml. Run from the repo root: target/node/node docs/features/36-voice-briefing.mock.mjs
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage('http://localhost:5173/#/', { width: 1280, height: 900 })
// The theme toggle reads its choice from storage, so set it and reload (sun icon in dark, as in ui-guidelines §5).
await page.evaluate(`localStorage.setItem('crew-health.theme', 'dark')`)
await page.reload()
// A real click: read-aloud needs a user gesture to play.
await page.send('Runtime.evaluate', { expression: `document.querySelector('button[aria-label="Voice control"]').click()`, userGesture: true })
for (let i = 0; i < 20 && !(await page.evaluate(`document.body.innerText.includes('Voice: speaking')`)); i++) await page.sleep(250)
await page.shot('docs/features/img/36-mock.png')
await page.close()
