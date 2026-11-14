// Sends one synthetic oximeter reading to the device link, as the Device Simulator would.
// Usage: target/node/node tools/publish-reading.mjs <spo2> [pulse]   (Node 22: global WebSocket)
// DEVICE_LINK_URL overrides the default ws://localhost:8080/ws/devices.
import { randomUUID } from 'node:crypto'

const [spo2, pulse] = process.argv.slice(2)
const whole = (value) => /^\d+$/.test(value)
if (!whole(spo2 ?? '') || (pulse !== undefined && !whole(pulse))) {
  console.error('usage: publish-reading.mjs <spo2> [pulse]   (whole numbers)')
  process.exit(2)
}

const url = process.env.DEVICE_LINK_URL ?? 'ws://localhost:8080/ws/devices'
const payload = {
  id: randomUUID(),
  t: new Date().toISOString(),
  spo2_pct: Number(spo2),
  ...(pulse === undefined ? {} : { pulse_bpm: Number(pulse) }),
  src: 'synthetic',
}
const frame = JSON.stringify({ topic: 'crew/a1/oximeter', payload })

const socket = new WebSocket(url)
const timeout = setTimeout(() => {
  console.error(`no device link at ${url} within 5 s`)
  process.exit(1)
}, 5_000)
socket.onerror = () => {}
socket.onclose = () => {
  console.error(`no device link at ${url}`)
  process.exit(1)
}
socket.onopen = () => {
  socket.send(frame)
  const waitForFlush = setInterval(() => {
    if (socket.bufferedAmount > 0) return
    clearInterval(waitForFlush)
    clearTimeout(timeout)
    socket.onclose = () => {
      console.log(frame)
      process.exit(0)
    }
    socket.close()
  }, 10)
}
