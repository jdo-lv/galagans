// Mock screenshots and layout checks for issue #61 (body figure redesign), taken from the running app.
// Run from the repo root with the frontend dev server up: node docs/features/61-body-figure.mock.mjs [base url]
// Prints the computed values the layout ACs need (jsdom can't measure layout).
import { openPage } from '../../tools/cdp.mjs'

const base = process.argv[2] ?? 'http://localhost:5173'

const measure = `(() => {
  const box = (el) => el.getBoundingClientRect()
  const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  const silhouette = document.querySelector('.body-figure .silhouette')
  const legend = document.querySelector('.level-legend')
  const ul = getComputedStyle(legend.querySelector('ul'))
  const todo = document.querySelector('.organ--todo')
  const labels = [...document.querySelectorAll('.hotspot')]
  // The legend's visible parts (heading and chips) must not cover the drawing: sample the silhouette under each.
  const svg = document.querySelector('.body-figure svg')
  const pt = svg.createSVGPoint()
  const l = box(legend)
  const hitsOn = []
  for (const part of [legend.querySelector('.level-legend__heading'), ...legend.querySelectorAll('.badge')]) {
    const r = box(part)
    for (let x = r.left; x <= r.right; x += 2)
      for (let y = r.top; y <= r.bottom; y += 2) {
        pt.x = x; pt.y = y
        const p = pt.matrixTransform(silhouette.getScreenCTM().inverse())
        if (silhouette.isPointInFill(p) || silhouette.isPointInStroke(p)) { hitsOn.push(part.textContent.trim()); x = r.right + 1; break }
      }
  }
  return {
    silhouetteHeightPx: Math.round(box(silhouette).height),
    legendCoversSilhouette: hitsOn,
    legendCoversLabel: labels.some((li) => overlap(box(li), l)),
    legendPosition: getComputedStyle(legend).position,
    legendColumn: ul.flexDirection + ' ' + ul.alignItems,
    // Each chip: word, rendered width, the width its icon + word need (scrollWidth), font and padding.
    chips: [...legend.querySelectorAll('.badge')].map((b) => {
      const c = getComputedStyle(b)
      return [b.textContent.trim(), Math.round(box(b).width), b.scrollWidth, c.fontSize + ' ' + c.fontWeight, c.padding]
    }),
    todoStroke: todo && getComputedStyle(todo).stroke + ' ' + getComputedStyle(todo).strokeWidth + ' fill ' + getComputedStyle(todo).fill,
  }
})()`

const home = await openPage(`${base}/#/`, { width: 1080, height: 810 })
await home.sleep(1000)
console.log('female', JSON.stringify(await home.evaluate(measure)))
await home.shot('docs/features/img/61-mock.png')
// The male outline is not wired to any screen: swap the path in place to check it against the same layout.
await home.evaluate(`import('/src/ui/bodyOutlines.ts').then((m) => document.querySelector('.body-figure .silhouette').setAttribute('d', m.BODY_OUTLINES.male))`)
await home.sleep(300)
console.log('male', JSON.stringify(await home.evaluate(measure)))
await home.reload()
await home.evaluate(`document.documentElement.dataset.theme = 'dark'`)
await home.sleep(500)
await home.shot('docs/features/img/61-home-dark.png')
await home.close()

const stats = await openPage(`${base}/#/stats`, { width: 1080, height: 810, port: 9334 })
await stats.sleep(1000)
console.log('stats', JSON.stringify({ bodyFigure: await stats.evaluate(`!!document.querySelector('.body-figure')`) }))
await stats.shot('docs/features/img/61-mock-stats.png')
await stats.close()
