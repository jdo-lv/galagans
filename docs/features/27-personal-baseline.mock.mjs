// Screenshot of the static mock for the personal baseline issue (#27). Run from the repo root: node docs/features/27-personal-baseline.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage(`file://${resolve('docs/features/27-personal-baseline.mock.html')}`, { width: 1280, height: 900, port: 9345 })
await page.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await page.sleep(400)
await page.shot('docs/features/img/27-mock.png')
await page.close()
