// Stands in for the backend that will feed the dot display: sends crew/a1/dot-display frames to the device link.
// Usage: node tools/publish-dot-display.mjs <pct>        one value, 0–100
//        node tools/publish-dot-display.mjs --scenario   the 90 s scenario on a loop, one frame a second (Ctrl+C stops)
// Node 22+ (global WebSocket). DEVICE_LINK_URL overrides the default ws://localhost:8080/ws/devices.
import { randomUUID } from 'node:crypto'

const TOPIC = 'crew/a1/dot-display'
const url = process.env.DEVICE_LINK_URL ?? 'ws://localhost:8080/ws/devices'
const [arg] = process.argv.slice(2)
const scenario = arg === '--scenario'
if (!scenario && !(/^\d+(\.\d+)?$/.test(arg ?? '') && Number(arg) <= 100)) {
  console.error('usage: publish-dot-display.mjs <pct 0-100> | --scenario')
  process.exit(2)
}

/** The same curve as mockup 13 and the firmware's dev mode (lib/dotcore/scenario.cpp). */
function scenarioPct(t) {
  const wobble = Math.round(2 * Math.sin(t * 1.3))
  if (t < 6) return Math.min(100, 92 + wobble)
  if (t < 30) return 42 + wobble
  if (t < 40) return 25 + wobble
  if (t < 52) return 8 + wobble
  return Math.round(8 + ((Math.min(t, 90) - 52) / 38) * 84)
}

const frame = (pct) =>
  JSON.stringify({ topic: TOPIC, payload: { id: randomUUID(), t: new Date().toISOString(), pct, src: 'synthetic' } })

const socket = new WebSocket(url)
const timeout = setTimeout(() => {
  console.error(`no device link at ${url} within 5 s`)
  process.exit(1)
}, 5_000)
socket.onerror = () => {}
socket.onclose = () => {
  console.error(`device link at ${url} closed`)
  process.exit(1)
}
socket.onopen = () => {
  clearTimeout(timeout)
  if (scenario) {
    const start = Date.now()
    const send = () => {
      const text = frame(scenarioPct(((Date.now() - start) / 1000) % 90))
      socket.send(text)
      console.log(text)
    }
    send()
    setInterval(send, 1_000)
    return
  }
  const text = frame(Number(arg))
  socket.send(text)
  const waitForFlush = setInterval(() => {
    if (socket.bufferedAmount > 0) return
    clearInterval(waitForFlush)
    socket.onclose = () => {
      console.log(text)
      process.exit(0)
    }
    socket.close()
  }, 10)
}
