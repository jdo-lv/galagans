// Retakes the screenshot in 22-phg-oximeter.md. Needs the app on :8080 (mvn spring-boot:run);
// the reading goes through the real device link (/ws/devices) via tools/publish-reading.mjs.
// Run from the repo root: target/node/node docs/features/22-phg-oximeter.shots.mjs
import { execFileSync } from 'node:child_process'
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:8080/'

const page = await openPage(APP, { height: 1100, port: 9900 })
execFileSync(process.execPath, ['tools/publish-reading.mjs', '91', '61'], { stdio: 'inherit' })
await page.sleep(1500)
await page.shot('docs/features/img/22-home-oximeter.png')
await page.close()
