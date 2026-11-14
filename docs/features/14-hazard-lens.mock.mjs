// Screenshots of the static mock for issue #14. Run from the repo root: node docs/features/14-hazard-lens.mock.mjs
import { resolve } from 'node:path'
import { openPage } from '../../tools/cdp.mjs'

const url = `file://${resolve('docs/features/14-hazard-lens.mock.html')}`

const wide = await openPage(url, { width: 1280, height: 1040 })
await wide.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await wide.sleep(400)
await wide.shot('docs/features/img/14-mock.png')
await wide.close()

const phone = await openPage(url, { width: 390, height: 1100, port: 9334 })
await phone.evaluate(`document.documentElement.dataset.theme = 'light'; document.querySelector('.lens').scrollIntoView()`)
await phone.sleep(400)
await phone.shot('docs/features/img/14-mock-390.png')
await phone.close()
