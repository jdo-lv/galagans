import { BrandMark } from './BrandMark'
import { ThemeToggle } from './theme/ThemeToggle'

export function AppHeader() {
  return (
    <header className="app-header">
      <BrandMark />
      <h1 className="wordmark">Health</h1>
      <ThemeToggle />
    </header>
  )
}
