// Retakes the screenshots in 25-device-simulator.md. Run from the repo root with Node 22:
//   target/node/node docs/features/25-device-simulator.shots.mjs              (app on :8080: mvn spring-boot:run)
//   target/node/node docs/features/25-device-simulator.shots.mjs disconnected (app stopped; simulator served by
//                                                                               `npm run preview`, SIM_URL below)
import { openPage } from '../../tools/cdp.mjs'

const disconnected = process.argv[2] === 'disconnected'
const SIM = process.env.SIM_URL ?? (disconnected ? 'http://localhost:4173/simulator.html' : 'http://localhost:8080/simulator.html')
const img = (name) => `docs/features/img/25-${name}.png`

async function open(theme, port) {
  const page = await openPage(SIM, { port, height: 860 })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  await page.reload()
  return page
}
const clickButton = (page, text) =>
  page.evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === ${JSON.stringify(text)} && !b.disabled).click()`)
const fillNth = (page, selector, n, value) =>
  page.evaluate(`(() => {
    const input = document.querySelectorAll(${JSON.stringify(selector)})[${n}]
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)})
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)

if (disconnected) {
  const page = await open('light', 9950)
  await clickButton(page, 'Run')
  await fillNth(page, '.sim-inject input', 0, '91')
  await page.sleep(300)
  await clickButton(page, 'Publish')
  await page.sleep(500)
  await page.shot(img('disconnected'))
  await page.close()
} else {
  for (const [theme, port] of [['light', 9951], ['dark', 9952]]) {
    const page = await open(theme, port)
    if (theme === 'light') await page.shot(img('idle'))
    await clickButton(page, 'Run')
    await page.sleep(300)
    await fillNth(page, 'input[type=range]', 0, '91')
    await fillNth(page, '.sim-inject input', 0, '88')
    await fillNth(page, '.sim-inject input', 1, '61')
    await page.sleep(300)
    await clickButton(page, 'Publish')
    await page.sleep(500)
    await page.shot(img(`running-${theme}`))
    await page.close()
  }
}
