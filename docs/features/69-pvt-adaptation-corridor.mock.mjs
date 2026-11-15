// Screenshot of the static mock for the PVT adaptation corridor issue (#69). Run from the repo root: node docs/features/69-pvt-adaptation-corridor.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const page = await openPage(`file://${resolve('docs/features/69-pvt-adaptation-corridor.mock.html')}`, { width: 1280, height: 1000, port: 9345 })
await page.sleep(400)
await page.shot('docs/features/img/69-mock.png')
await page.close()
