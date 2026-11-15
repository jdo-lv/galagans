// Screenshot of the static mock for the dot display health status issue. Run from the repo root: target/node/node docs/features/dot-display-status.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage(`file://${resolve('docs/features/dot-display-status.mock.html')}`, { width: 1280, height: 760, port: 9348 })
await page.sleep(400)
await page.shot('docs/features/img/dot-display-status-mock.png')
await page.close()
