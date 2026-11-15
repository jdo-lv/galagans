// Screenshots of the static mock for issue #65. Run from the repo root: node docs/features/65-hazard-schematic.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const url = `file://${resolve('docs/features/65-hazard-schematic.mock.html')}`

const wide = await openPage(url, { width: 1280, height: 1100 })
await wide.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await wide.sleep(400)
await wide.shot('docs/features/img/65-mock.png')
await wide.close()

const phone = await openPage(url, { width: 390, height: 1900, port: 9334 })
await phone.evaluate(`document.documentElement.dataset.theme = 'light'`)
await phone.sleep(400)
await phone.shot('docs/features/img/65-mock-390.png')
await phone.close()
