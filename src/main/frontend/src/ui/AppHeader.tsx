import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './theme/ThemeToggle'

/** `actions` go before the theme toggle on the right. */
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
