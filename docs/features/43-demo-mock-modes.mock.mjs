// Screenshot of the static mock for issue #43. Run from the repo root: node docs/features/43-demo-mock-modes.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage(`file://${resolve('docs/features/43-demo-mock-modes.mock.html')}`, { width: 1280, height: 1800, port: 9347 })
await page.sleep(400)
await page.shot('docs/features/img/43-mock.png')
await page.close()
