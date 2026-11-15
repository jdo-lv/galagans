// Retakes the screenshots in 46-nav-bar.md. App must be running on :8080 (mvn spring-boot:run), or set APP_URL.
// Run from the repo root: target/node/node docs/features/46-nav-bar.shots.mjs
// CDP_PORT picks another DevTools port when 9333 is taken.
import { openPage } from '../../tools/cdp.mjs'

const img = (name) => `docs/features/img/46-${name}.png`
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { port: Number(process.env.CDP_PORT ?? 9333) })
const size = (width, height) => page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })

/** Opens `hash` in `theme` at `width` × `height`, with the theme stored the way the header toggle stores it. */
async function show(hash, theme, width = 1280, height = 800) {
  await size(width, height)
  await page.evaluate(`localStorage.setItem('crew-health.theme', '${theme}'); location.hash = '${hash}'`)
  await page.reload()
  // The launch splash fades out no earlier than 1.2 s after launch (ui/splash.ts).
  await page.sleep(1000)
}

/** The bar's strip only, for the hover and focus close-ups. */
async function shotBar(path) {
  const strip = await page.evaluate(`(() => { const r = document.querySelector('.nav-bar').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })()`)
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...strip, scale: 1 } })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(path, Buffer.from(data, 'base64'))
}

const centreOf = (label) =>
  page.evaluate(`(() => { const r = document.querySelector('.nav-bar a[aria-label="${label}"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)

await show('#/', 'dark')
await page.shot(img('home'))

await page.evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`)
await page.sleep(300)
await page.shot(img('home-bottom'))

await show('#/check-in', 'light')
await page.shot(img('check-in'))

await show('#/packet', 'dark')
await page.shot(img('messages'))

await show('#/statistics', 'light', 390, 844)
await page.shot(img('statistics-390'))

await show('#/statistics', 'light', 360, 780)
await page.shot(img('statistics-360'))

await show('#/', 'light')
const home = await centreOf('Home')
await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...home })
await page.sleep(300)
if (!(await page.evaluate(`document.querySelector('.nav-bar a[aria-label="Home"]').matches(':hover')`))) throw new Error('Home is not hovered')
await shotBar(img('hover'))
await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })

// Focus Check-in, then Tab once, so Messages gets keyboard focus and its :focus-visible ring.
await page.evaluate(`document.querySelector('.nav-bar a[aria-label="Check-in"]').focus()`)
await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
await page.sleep(300)
if (!(await page.evaluate(`document.activeElement.matches('.nav-bar a[aria-label="Messages"]:focus-visible')`))) throw new Error('Messages has no keyboard focus')
await shotBar(img('focus'))

await show('#/pvt', 'light')
await page.shot(img('pvt'))

await page.close()
