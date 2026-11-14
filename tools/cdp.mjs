// Headless Chrome over the DevTools protocol, for feature-doc screenshots of the running app.
// Needs Node 22 (global WebSocket): run with target/node/node after a full build.
// Usage in a shots script:
//   import { openPage } from '../../tools/cdp.mjs'
//   const page = await openPage('http://localhost:8080/')
//   await page.evaluate(`location.hash = '#/check-in'`); await page.fill('input[name=heartRate]', '63')
//   await page.click('.check-in button[type=submit]')  // or saveCheckIn(page, { spo2: 88 }) from tools/checkin-shots.mjs
//   await page.shot('docs/features/img/1-warning.png'); await page.close()
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function openPage(url, { width = 1280, height = 800, port = 9333, settleMs = 1500 } = {}) {
  const chrome = spawn(CHROME, [
    '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore' })

  let target
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200)
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page')
    } catch {}
  }
  if (!target) throw new Error(`Chrome did not open a debugging port on ${port}`)

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve) => (ws.onopen = resolve))
  let id = 0
  const pending = new Map()
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    pending.get(message.id)?.(message.result)
    pending.delete(message.id)
  }
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++id, resolve)
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value

  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Page.enable')
  await send('Page.navigate', { url })
  await sleep(settleMs)

  return {
    send,
    evaluate,
    sleep,
    reload: async () => {
      await send('Page.reload')
      await sleep(settleMs)
    },
    /** Sets an input's value the way React sees it. */
    fill: (selector, value) =>
      evaluate(`(() => {
        const input = document.querySelector(${JSON.stringify(selector)})
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(String(value))})
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })()`),
    click: async (selector, waitMs = 800) => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
      await sleep(waitMs)
    },
    shot: async (path) =>
      writeFileSync(path, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')),
    close: async () => {
      ws.close()
      chrome.kill()
    },
  }
}
