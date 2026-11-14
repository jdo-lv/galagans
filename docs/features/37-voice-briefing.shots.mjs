// Screenshots of voice control (#37). Needs the Vite dev server (:5173) and voice-host/compose.yaml running.
// Run from the repo root: target/node/node docs/features/37-voice-briefing.shots.mjs
import { openPage } from '../../tools/cdp.mjs'

const APP = 'http://localhost:5173/'
let port = 9440

/** Opens the app at `hash` in the stored `theme`; `mic` grants or denies the microphone (headless denies by default). */
async function open({ theme = 'dark', width = 1280, height = 900, hash = '#/', mic = true, blockVoiceHost = false }) {
  const page = await openPage(APP, { width, height, port: port++ })
  await page.evaluate(`localStorage.setItem('crew-health.theme', ${JSON.stringify(theme)}); location.hash = ${JSON.stringify(hash)}`)
  if (mic) await page.send('Browser.grantPermissions', { origin: new URL(APP).origin, permissions: ['audioCapture'] })
  // Failing every /voice/* request is the same, for the app, as a voice host that can't be reached.
  if (blockVoiceHost) {
    await page.send('Network.enable')
    await page.send('Network.setBlockedURLs', { urls: ['*/voice/*'] })
  }
  // Headless Chrome sometimes never ends audio; screenshots don't show sound, so playback ends at once.
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `HTMLMediaElement.prototype.play = function () { setTimeout(() => this.dispatchEvent(new Event('ended')), 50); return Promise.resolve() }`,
  })
  await page.reload()
  // The splash (#38) fades out, then leaves the page.
  for (let i = 0; i < 40 && (await page.evaluate(`!!document.getElementById('splash')`)); i++) await page.sleep(250)
  return page
}

/** Taps the mic as a user would (read-aloud needs a user gesture), then waits for the pill. */
async function voiceOn(page, pill) {
  await page.send('Runtime.evaluate', { expression: `document.querySelector('button[aria-label="Voice control"]').click()`, userGesture: true })
  for (let i = 0; i < 120; i++) {
    if (await page.evaluate(`document.body.innerText.includes(${JSON.stringify(pill)})`)) return
    await page.sleep(250)
  }
  throw new Error(`pill "${pill}" never showed; pills: ${await page.evaluate(`[...document.querySelectorAll('.pill')].map((p) => p.innerText).join(' | ')`)}`)
}

async function shot(options, pill, path) {
  const page = await open(options)
  try {
    if (pill) await voiceOn(page, pill)
    await page.shot(path)
  } finally {
    await page.close()
  }
}

await shot({}, 'Voice: listening', 'docs/features/img/37-listening.png')
await shot({ blockVoiceHost: true }, 'Voice host unreachable', 'docs/features/img/37-unreachable.png')
await shot({ mic: false }, 'Voice: audio not available', 'docs/features/img/37-audio-not-available.png')
await shot({ hash: '#/pvt' }, null, 'docs/features/img/37-pvt-disabled.png')
await shot({ theme: 'light', width: 390, height: 900 }, 'Voice: listening', 'docs/features/img/37-listening-390.png')
