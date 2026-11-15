import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './theme/ThemeToggle'

/** `actions` go first on the right, before the theme toggle. */
export function AppHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="app-header">
      <BrandMark />
      <h1 className="wordmark">Health</h1>
      <div className="header-actions">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}
