// Screenshots of the static mock for the reporting-win issue (#40). Run from the repo root: node docs/features/40-reporting-win.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const url = `file://${resolve('docs/features/40-reporting-win.mock.html')}`

const wide = await openPage(url, { width: 1280, height: 1000 })
await wide.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await wide.sleep(400)
await wide.shot('docs/features/img/40-mock.png')
await wide.close()

const phone = await openPage(url, { width: 390, height: 1700, port: 9334 })
await phone.evaluate(`document.documentElement.dataset.theme = 'light'`)
await phone.sleep(400)
await phone.shot('docs/features/img/40-mock-390.png')
await phone.close()
