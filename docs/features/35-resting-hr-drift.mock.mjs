// Screenshot of the static mock for the resting HR drift issue (#35). Run from the repo root: node docs/features/35-resting-hr-drift.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage(`file://${resolve('docs/features/35-resting-hr-drift.mock.html')}`, { width: 1280, height: 900, port: 9345 })
await page.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await page.sleep(400)
await page.shot('docs/features/img/35-mock.png')
await page.close()
