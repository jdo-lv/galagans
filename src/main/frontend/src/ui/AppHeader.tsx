import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { AddIcon } from './icons'
import { ThemeToggle } from './theme/ThemeToggle'
import { CHECK_IN_HASH } from './useHashRoute'

/** `actions` go first on the right, before "Add entry" and the theme toggle. */
export function AppHeader({ showAdd = false, actions }: { showAdd?: boolean; actions?: ReactNode }) {
  return (
    <header className="app-header">
      <BrandMark />
      <h1 className="wordmark">Health</h1>
      <div className="header-actions">
        {actions}
        {showAdd && (
          <a className="icon-button header-add" href={CHECK_IN_HASH} aria-label="Add entry">
            <AddIcon size={30} />
          </a>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
