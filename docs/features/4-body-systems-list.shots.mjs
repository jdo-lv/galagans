// Retakes the screenshots in 4-body-systems-list.md. App must be running on :8080 (mvn spring-boot:run).
// Run from the repo root: target/node/node docs/features/4-body-systems-list.shots.mjs
import { openPage } from '../../tools/cdp.mjs'
import { saveCheckIn } from '../../tools/checkin-shots.mjs'

const img = (name) => `docs/features/img/4-${name}.png`
// Tall enough for all ten rows plus an open explanation.
const page = await openPage(process.env.APP_URL ?? 'http://localhost:8080/', { height: 1350 })

// Since #29 values are entered through the check-in steps.
const save = (spo2) => saveCheckIn(page, { spo2 })

await page.shot(img('no-data'))
for (const [spo2, state] of [[92, 'check'], [88, 'emergency']]) {
  await save(spo2)
  await page.shot(img(state))
}
await page.close()
