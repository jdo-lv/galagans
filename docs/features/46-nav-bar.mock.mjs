// Issue mock (#46): the navigation bar injected into the running crew app, before it is built (mockups 14 and 15).
// Start the dev server (cd src/main/frontend && npm run dev), then from the repo root: node docs/features/46-nav-bar.mock.mjs
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173/'

// Tabler outline paths (@tabler/icons-react 3.50.0): home, clipboard-list, satellite, chart-bar
const PATHS = {
  home: '<path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>',
  'check-in': '<path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"/><path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2"/><path d="M9 12l.01 0"/><path d="M13 12l2 0"/><path d="M9 16l.01 0"/><path d="M13 16l2 0"/>',
  packet: '<path d="M3.707 6.293l2.586 -2.586a1 1 0 0 1 1.414 0l5.586 5.586a1 1 0 0 1 0 1.414l-2.586 2.586a1 1 0 0 1 -1.414 0l-5.586 -5.586a1 1 0 0 1 0 -1.414"/><path d="M6 10l-3 3l3 3l3 -3"/><path d="M10 6l3 -3l3 3l-3 3"/><path d="M12 12l1.5 1.5"/><path d="M14.5 17a2.5 2.5 0 0 0 2.5 -2.5"/><path d="M15 21a6 6 0 0 0 6 -6"/>',
  statistics: '<path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6"/><path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10"/><path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14"/><path d="M4 20h14"/>',
}
const ITEMS = [
  ['home', '#/', 'Home'],
  ['check-in', '#/check-in', 'Check-in'],
  ['packet', '#/packet', 'Messages'],
  ['statistics', '#/statistics', 'Statistics'],
]

// The strip in the page background keeps scrolled cards from showing around the pill.
const CSS = `
.app { padding-bottom: calc(var(--target-min) + 2 * var(--space-2) + 2px + 2 * var(--space-3) + var(--space-4)); }
.nav-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; padding: var(--space-3) 0;
  background: var(--color-bg); transition: var(--transition-theme); }
.nav-bar__items { list-style: none; margin: 0; display: flex; gap: var(--gap-targets); padding: var(--space-2);
  background: var(--color-surface); border: 1px solid var(--color-edge); border-radius: var(--radius-pill); }
.nav-bar a, .nav-bar a:hover { width: 64px; height: var(--target-min); border-radius: var(--radius-pill); display: grid; place-items: center; color: var(--color-text); }
.nav-bar a[aria-current='page'], .nav-bar a[aria-current='page']:hover { background: var(--color-inverse-bg); color: var(--color-inverse-text); }
/* The phone header rule goes: two header buttons fit beside a page-centred wordmark */
@media (max-width: 599px) { .app-header { grid-template-columns: 1fr auto 1fr; } }
`

const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon" aria-hidden="true">${paths}</svg>`

const nav = (current) =>
  `<nav class="nav-bar" aria-label="Main"><ul class="nav-bar__items">${ITEMS.map(
    ([kind, href, label]) => `<li><a href="${href}" aria-label="${label}"${kind === current ? ' aria-current="page"' : ''}>${svg(PATHS[kind])}</a></li>`,
  ).join('')}</ul></nav>`

const STATISTICS = `<main><section class="stack" aria-labelledby="statistics-heading">
  <h2 id="statistics-heading" class="section-heading" tabindex="-1">Statistics</h2><p class="muted">Not built yet.</p></section></main>`

async function shoot({ width, height, theme, current, file }) {
  const page = await openPage(APP, { width, height })
  await page.evaluate(`localStorage.setItem('crew-health.theme', '${theme}')`)
  await page.reload()
  await page.sleep(1500)
  await page.evaluate(`(() => {
    document.querySelector('.header-add')?.remove()
    if (${current === 'statistics'}) document.querySelector('main').outerHTML = ${JSON.stringify(STATISTICS)}
    document.head.insertAdjacentHTML('beforeend', ${JSON.stringify(`<style>${CSS}</style>`)})
    document.querySelector('.app').insertAdjacentHTML('beforeend', ${JSON.stringify(nav(current))})
  })()`)
  await page.sleep(400)
  await page.shot(file)
  await page.close()
}

await shoot({ width: 1280, height: 800, theme: 'dark', current: 'home', file: 'docs/features/img/46-mock.png' })
await shoot({ width: 390, height: 844, theme: 'light', current: 'statistics', file: 'docs/features/img/46-mock-390.png' })
