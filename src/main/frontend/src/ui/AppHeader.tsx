import { BrandMark } from './BrandMark'
import { AddIcon } from './icons'
import { ThemeToggle } from './theme/ThemeToggle'
import { CHECK_IN_HASH } from './useHashRoute'

export function AppHeader({ showAdd = false }: { showAdd?: boolean }) {
  return (
    <header className="app-header">
      <BrandMark />
      <h1 className="wordmark">Health</h1>
      <div className="header-actions">
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
