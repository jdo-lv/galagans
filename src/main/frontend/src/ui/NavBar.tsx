import { AddEntryIcon, GroundLinkIcon, HomeIcon, RewardsIcon, StatisticsIcon, type AppIcon } from './icons'
import { ADD_HASH, GROUND_HASH, STATISTICS_HASH, type Route } from './useHashRoute'

/** `page`: the screen the link opens. `section`: screens reached from it, which mark it `aria-current="true"`. */
type Destination = { href: string; page: Route['kind']; section?: Route['kind'][] }
/** No `to`: shown but not available yet. `centre`: the raised round + with only an aria-label. */
type Item = { label: string; Icon: AppIcon; to?: Destination; centre?: boolean }

// One row per item in the bar (ideas/ui-guidelines.md §5 "Navigation bar"): icon over word, the word names the link.
const ITEMS: Item[] = [
  { label: 'Home', Icon: HomeIcon, to: { href: '#/', page: 'home' } },
  { label: 'Stats', Icon: StatisticsIcon, to: { href: STATISTICS_HASH, page: 'statistics' } },
  { label: 'Add entry', Icon: AddEntryIcon, to: { href: ADD_HASH, page: 'add', section: ['check-in', 'symptoms'] }, centre: true },
  { label: 'Rewards', Icon: RewardsIcon },
  { label: 'Ground', Icon: GroundLinkIcon, to: { href: GROUND_HASH, page: 'ground', section: ['packet'] } },
]

function ariaCurrent({ page, section = [] }: Destination, current: Route['kind']): 'page' | 'true' | undefined {
  if (page === current) return 'page'
  return section.includes(current) ? 'true' : undefined
}

function BarItem({ item: { label, Icon, to, centre }, current }: { item: Item; current: Route['kind'] }) {
  // A plain span, so Tab skips it; the hidden words say why, since a span can't carry aria-disabled.
  if (!to) {
    return (
      <span className="nav-bar__soon">
        <Icon size={24} />
        <span>{label}</span>
        <span className="visually-hidden">{' (not available yet)'}</span>
      </span>
    )
  }
  const currentValue = ariaCurrent(to, current)
  if (centre) {
    return (
      <a href={to.href} className="nav-bar__add" aria-label={label} aria-current={currentValue}>
        <Icon size={30} />
      </a>
    )
  }
  return (
    <a href={to.href} aria-current={currentValue}>
      <Icon size={24} />
      <span>{label}</span>
    </a>
  )
}

/** `current` is the route on screen; a system detail marks no item. */
export function NavBar({ current }: { current: Route['kind'] }) {
  return (
    <nav className="nav-bar" aria-label="Main">
      <ul className="nav-bar__items">
        {ITEMS.map((item) => (
          <li key={item.label}>
            <BarItem item={item} current={current} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
