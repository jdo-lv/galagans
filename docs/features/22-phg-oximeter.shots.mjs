// Retakes the screenshot in 22-phg-oximeter.md. Needs the app on :8080 (mvn spring-boot:run)
// and the broker running (see CLAUDE.md "Build and run"); the reading goes through the real broker.
// Run from the repo root: target/node/node docs/features/22-phg-oximeter.shots.mjs
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'
const CONTAINER_CLI = process.env.CONTAINER_CLI ?? 'docker'

const page = await openPage(APP, { height: 1100, port: 9900 })
const payload = JSON.stringify({ id: randomUUID(), t: new Date().toISOString(), spo2_pct: 91, pulse_bpm: 61, src: 'synthetic' })
execFileSync(CONTAINER_CLI, ['exec', 'crew-broker', 'mosquitto_pub', '-t', 'crew/a1/oximeter', '-m', payload])
await page.sleep(1500)
await page.shot('docs/features/img/22-home-oximeter.png')
await page.close()
