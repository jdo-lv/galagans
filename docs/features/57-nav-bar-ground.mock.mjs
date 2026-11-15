// Issue mock (#50): the five-item navigation bar, the Add entry chooser and the Ground history, injected into the
// running crew app before they are built. Start the dev server (cd src/main/frontend && npm run dev), then from the
// repo root: APP_URL=http://localhost:5173/ node docs/features/50-nav-bar-ground.mock.mjs
import { openPage } from '../../tools/cdp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173/'

// Tabler outline paths (@tabler/icons-react 3.50.0)
const P = (...d) => d.map((x) => `<path d="${x}"/>`).join('')
const PATHS = {
  man: P('M10 16v5', 'M14 16v5', 'M9 9h6l-1 7h-4l-1 -7', 'M5 11c1.333 -1.333 2.667 -2 4 -2', 'M19 11c-1.333 -1.333 -2.667 -2 -4 -2', 'M10 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'),
  chart: P('M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6', 'M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10', 'M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14', 'M4 20h14'),
  plus: P('M12 5l0 14', 'M5 12l14 0'),
  gift: P('M3 9a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1l0 -2', 'M12 8l0 13', 'M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7', 'M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5'),
  satellite: P('M3.707 6.293l2.586 -2.586a1 1 0 0 1 1.414 0l5.586 5.586a1 1 0 0 1 0 1.414l-2.586 2.586a1 1 0 0 1 -1.414 0l-5.586 -5.586a1 1 0 0 1 0 -1.414', 'M6 10l-3 3l3 3l3 -3', 'M10 6l3 -3l3 3l-3 3', 'M12 12l1.5 1.5', 'M14.5 17a2.5 2.5 0 0 0 2.5 -2.5', 'M15 21a6 6 0 0 0 6 -6'),
  clipboard: P('M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2', 'M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2', 'M9 12l.01 0', 'M13 12l2 0', 'M9 16l.01 0', 'M13 16l2 0'),
  report: P('M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2', 'M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2', 'M10 14l4 0', 'M12 12l0 4'),
}
const svg = (k, size = 24) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon" aria-hidden="true">${PATHS[k]}</svg>`

const CSS = `
.nav-bar__items { align-items: center; gap: var(--space-2); }
.nav-bar a, .nav-bar a:hover, .nav-bar__soon { width: 76px; height: auto; min-height: var(--target-min); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; padding: var(--space-1) 0; border-radius: var(--radius-pill); color: var(--color-text);
  text-decoration: none; font-weight: 500; }
.nav-bar__soon { color: var(--color-text-muted-on-surface); }
.nav-bar a.nav-bar__add { width: 68px; height: 68px; margin-block: calc(-1 * var(--space-4)); border-radius: 50%;
  background: var(--color-inverse-bg); color: var(--color-inverse-text); }
.nav-bar a.nav-bar__add[aria-current='page'] { outline: 2px solid var(--color-edge-on-surface); outline-offset: 2px; }
@media (max-width: 599px) { .nav-bar__items { gap: var(--space-1); } .nav-bar a, .nav-bar a:hover, .nav-bar__soon { width: 64px; } }
.add-choices { display: grid; gap: var(--space-3); max-width: 420px; }
.add-choices a { display: flex; align-items: center; gap: var(--space-3); justify-content: flex-start; text-decoration: none; }
.ground-new { align-self: flex-start; text-decoration: none; display: inline-flex; align-items: center; }
`

const ITEMS = [
  ['home', '#/', 'Home', 'man'],
  ['statistics', '#/statistics', 'Stats', 'chart'],
  ['add', '#/add', 'Add entry', 'plus'],
  ['rewards', null, 'Rewards', 'gift'],
  ['ground', '#/ground', 'Ground', 'satellite'],
]

const nav = (current) =>
  `<nav class="nav-bar" aria-label="Main"><ul class="nav-bar__items">${ITEMS.map(([kind, href, label, icon]) =>
    kind === 'add'
      ? `<li><a class="nav-bar__add" href="${href}" aria-label="${label}"${kind === current ? ' aria-current="page"' : ''}>${svg(icon, 30)}</a></li>`
      : href
        ? `<li><a href="${href}"${kind === current ? ' aria-current="page"' : ''}>${svg(icon)}<span>${label}</span></a></li>`
        : `<li><span class="nav-bar__soon" aria-disabled="true">${svg(icon)}<span>${label}</span></span></li>`,
  ).join('')}</ul></nav>`

const ADD = `<main><section class="stack" aria-labelledby="add-heading">
  <h2 id="add-heading" class="section-heading" tabindex="-1">Add entry</h2>
  <div class="add-choices">
    <a class="button-primary" href="#/check-in">${svg('clipboard')}Morning check-in</a>
    <a class="button-secondary" href="#/symptoms">${svg('report')}Log symptoms</a>
  </div></section></main>`

const row = (built, delivery, contents, note) => `<tr><th scope="row" class="num">${built}</th><td>${delivery}</td><td>${contents}</td><td>${note}</td></tr>`
const GROUND = `<main><section class="stack" aria-labelledby="ground-heading">
  <div class="packet-head"><h2 id="ground-heading" class="section-heading" tabindex="-1">Ground</h2>
  <p class="muted packet-privacy"><span>Shared with flight medicine only</span></p></div>
  <a class="button-primary ground-new" href="#/packet">New surgeon packet</a>
  <section class="card" aria-labelledby="history-heading"><h3 id="history-heading" class="card-heading">Packet history</h3>
  <table class="packet-table"><thead><tr><th scope="col">Built</th><th scope="col">Delivery</th><th scope="col">Contents</th><th scope="col">Crew note</th></tr></thead><tbody>
  ${row('14 Nov 07:50', 'Queued, waits for the ground link', '1 item', '<span class="muted">No note</span>')}
  ${row('14 Nov 07:00', 'Sent 14 Nov 07:01 · arrived 07:15', '2 items · 1 flagged', 'Headache since wake-up')}
  </tbody></table></section></section></main>`

async function shoot({ width, height, theme, current, screen, file }) {
  const page = await openPage(APP, { width, height })
  await page.evaluate(`localStorage.setItem('crew-health.theme', '${theme}')`)
  await page.reload()
  await page.sleep(1500)
  await page.evaluate(`(() => {
    if (${JSON.stringify(screen)}) document.querySelector('main').outerHTML = ${JSON.stringify(screen ?? '')}
    document.head.insertAdjacentHTML('beforeend', ${JSON.stringify(`<style>${CSS}</style>`)})
    document.querySelector('.nav-bar').outerHTML = ${JSON.stringify(nav(current))}
  })()`)
  await page.sleep(400)
  await page.shot(file)
  await page.close()
}

await shoot({ width: 1280, height: 800, theme: 'dark', current: 'home', file: 'docs/features/img/50-mock.png' })
await shoot({ width: 1280, height: 800, theme: 'light', current: 'ground', screen: GROUND, file: 'docs/features/img/50-mock-ground.png' })
await shoot({ width: 390, height: 844, theme: 'light', current: 'add', screen: ADD, file: 'docs/features/img/50-mock-add-390.png' })
