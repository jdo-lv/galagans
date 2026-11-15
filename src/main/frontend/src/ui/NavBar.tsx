import { GroundLinkIcon, HomeIcon, QuestionnaireIcon, StatisticsIcon } from './icons'
import { CHECK_IN_HASH, PACKET_HREF, STATISTICS_HASH, type Route } from './useHashRoute'

type Item = { kind: Route['kind']; href: string; label: string; Icon: typeof HomeIcon }

// One row per screen in the bar (ideas/ui-guidelines.md §5 "Navigation bar"). Icons only: the word is the link's name.
const ITEMS: Item[] = [
  { kind: 'home', href: '#/', label: 'Home', Icon: HomeIcon },
  { kind: 'check-in', href: CHECK_IN_HASH, label: 'Check-in', Icon: QuestionnaireIcon },
  { kind: 'packet', href: PACKET_HREF, label: 'Messages', Icon: GroundLinkIcon },
  { kind: 'statistics', href: STATISTICS_HASH, label: 'Statistics', Icon: StatisticsIcon },
]

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main">
      <ul className="nav-bar__items">
        {ITEMS.map(({ kind, href, label, Icon }) => (
          <li key={kind}>
            <a href={href} aria-label={label}>
              <Icon size={24} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
