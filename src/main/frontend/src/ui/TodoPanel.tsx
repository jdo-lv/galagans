import { useId, type ReactNode } from 'react'
import type { TodoItem } from '../application/homeVariant'
import { CheckInScreen } from './CheckInScreen'
import { TodoBadge } from './SystemStatusList'
import { PVT_HASH } from './useHashRoute'

/** What an open item offers, one row per to-do source. */
const ACTIONS: Record<TodoItem['id'], (item: TodoItem, onSaved: () => void) => ReactNode> = {
  'check-in': (_, onSaved) => <CheckInScreen embedded onSaved={onSaved} />,
  pvt: (item) => (
    <a href={PVT_HASH} className="button-primary">
      {`Start PVT · ${item.takes}`}
    </a>
  ),
}

function Item({ item, open, onOpen, onSaved }: { item: TodoItem; open: boolean; onOpen: () => void; onSaved: () => void }) {
  const bodyId = useId()
  return (
    <li className="todo-item">
      <h3 className="todo-item__head">
        <button type="button" aria-expanded={open} aria-controls={open ? bodyId : undefined} onClick={onOpen}>
          {/* The spaces keep the button's name readable: "Morning check-in Due 07:00–09:00 To do". */}
          <span className="todo-item__title">{item.title}</span> <span className="todo-item__when">{item.when}</span> <TodoBadge />
        </button>
      </h3>
      {open && (
        <div id={bodyId} className="todo-item__body">
          <dl className="todo-facts">
            {(
              [
                ['Why', item.why],
                ['Takes', item.takes],
                ['Source', item.source],
              ] as const
            ).map(([term, text]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          {ACTIONS[item.id](item, onSaved)}
        </div>
      )}
    </li>
  )
}

/** Home's To do card (#52): every owed input, one open at a time. */
export function TodoPanel({
  items,
  openId,
  onOpen,
  onSaved,
}: {
  items: TodoItem[]
  openId: TodoItem['id']
  onOpen: (id: TodoItem['id']) => void
  onSaved: () => void
}) {
  const headingId = useId()
  return (
    <section className="card todo" aria-labelledby={headingId}>
      <h2 id={headingId} className="card-heading">
        {`To do · ${items.length}`}
      </h2>
      <ul className="todo-list">
        {items.map((item) => (
          <Item key={item.id} item={item} open={item.id === openId} onOpen={() => onOpen(item.id)} onSaved={onSaved} />
        ))}
      </ul>
    </section>
  )
}
