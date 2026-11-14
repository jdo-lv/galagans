// Retakes the screenshots in 25-device-simulator.md. Run from the repo root with Node 22:
//   target/node/node docs/features/25-device-simulator.shots.mjs              (app on :8080: mvn spring-boot:run)
//   target/node/node docs/features/25-device-simulator.shots.mjs disconnected (app stopped; simulator served by
//                                                                               `npm run preview`, SIM_URL below)
import { openPage } from '../../tools/cdp.mjs'

const disconnected = process.argv[2] === 'disconnected'
const SIM = process.env.SIM_URL ?? (disconnected ? 'http://localhost:4173/simulator.html' : 'http://localhost:8080/simulator.html')
const img = (name) => `docs/features/img/25-${name}.png`

async function open(theme, port) {
  const page = await openPage(SIM, { port, height: 1080 })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
  await page.reload()
  return page
}
const section = (device) =>
  `[...document.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === ${JSON.stringify(device)})`
const click = (page, device, text) =>
  page.evaluate(`[...${section(device)}.querySelectorAll('button')].find((b) => b.textContent === ${JSON.stringify(text)}).click()`)
const fill = (page, device, label, value) =>
  page.evaluate(`(() => {
    const input = [...${section(device)}.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(${JSON.stringify(label)})).querySelector('input')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)})
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)

async function drive(page) {
  await click(page, 'Pulse oximeter', 'Start')
  await fill(page, 'Wrist bracelet', 'Every', '5')
  await click(page, 'Wrist bracelet', 'Start')
  await fill(page, 'Environment node', 'CO₂', '3.4')
  await click(page, 'Environment node', 'Start')
  await click(page, 'BP cuff', 'Send now')
  await page.sleep(600)
}

if (disconnected) {
  const page = await open('light', 9950)
  await drive(page)
  await page.shot(img('disconnected'))
  await page.close()
} else {
  for (const [theme, port] of [['light', 9951], ['dark', 9952]]) {
    const page = await open(theme, port)
    if (theme === 'light') await page.shot(img('idle'))
    await drive(page)
    await page.shot(img(`running-${theme}`))
    await page.close()
  }
}
