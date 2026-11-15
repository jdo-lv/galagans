import { CHECK_IN_HASH, PACKET_HREF, STATISTICS_HASH, type Route } from './useHashRoute'

type Item = { kind: Route['kind']; href: string; label: string }

// One row per screen in the bar (ideas/ui-guidelines.md §5 "Navigation bar").
const ITEMS: Item[] = [
  { kind: 'home', href: '#/', label: 'Home' },
  { kind: 'check-in', href: CHECK_IN_HASH, label: 'Check-in' },
  { kind: 'packet', href: PACKET_HREF, label: 'Messages' },
  { kind: 'statistics', href: STATISTICS_HASH, label: 'Statistics' },
]

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main">
      <ul className="nav-bar__items">
        {ITEMS.map(({ kind, href, label }) => (
          <li key={kind}>
            <a href={href} aria-label={label} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
