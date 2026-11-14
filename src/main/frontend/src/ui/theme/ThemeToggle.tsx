import { DarkThemeIcon, LightThemeIcon } from '../icons'
import { useTheme } from './useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button type="button" className="icon-button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <LightThemeIcon /> : <DarkThemeIcon />}
    </button>
  )
}
