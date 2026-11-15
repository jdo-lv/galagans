// Fails the build unless every entry exists and the crew service worker leaves the simulator (issue #25 AC13)
// and the device screen alone.
// Usage: node scripts/check-build.mjs [outDir], default ../resources/static.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? '../resources/static'
const errors = []

for (const file of ['index.html', 'simulator.html', 'device.html']) {
  if (!existsSync(join(dir, file))) errors.push(`missing ${file}`)
}

const swPath = join(dir, 'sw.js')
if (!existsSync(swPath)) {
  errors.push('missing sw.js')
} else {
  const sw = readFileSync(swPath, 'utf8')
  if (/url:\s*"simulator\.html"/.test(sw)) errors.push('sw.js precaches simulator.html')
  if (/url:\s*"assets\/simulator-/.test(sw)) errors.push('sw.js precaches an assets/simulator-* file')
  if (/url:\s*"device\.html"/.test(sw)) errors.push('sw.js precaches device.html')
  if (/url:\s*"assets\/device-/.test(sw)) errors.push('sw.js precaches an assets/device-* file')
  for (const pattern of ['/simulator\\.html$/', '/^\\/ws\\//', '/^\\/device\\//']) {
    if (!sw.includes(pattern)) errors.push(`sw.js has no navigate fallback denylist entry ${pattern}`)
  }
}

if (errors.length > 0) {
  console.error(`check-build failed in ${dir}:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`check-build ok in ${dir}`)
