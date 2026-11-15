import { createContext, useContext, type ReactNode } from 'react'

const SideContext = createContext<ReactNode>(null)

/** The context pills the app shows first in every screen's side panel. */
export function SideContextProvider({ pills, children }: { pills: ReactNode; children: ReactNode }) {
  return <SideContext.Provider value={pills}>{children}</SideContext.Provider>
}

/**
 * The shell every screen fills (ideas/ui-guidelines.md §4 "App shell"): a side panel, then the main panel with one
 * pane, or two when `secondary` is given. DOM order side → primary → secondary is also the focus and phone order.
 * `label` or `labelledBy` makes the screen a named region.
 */
export function ScreenLayout({
  side,
  primary,
  secondary,
  label,
  labelledBy,
}: {
  side?: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  label?: string
  labelledBy?: string
}) {
  const pills = useContext(SideContext)
  const Root = label || labelledBy ? 'section' : 'div'
  return (
    <Root className="screen" aria-label={label} aria-labelledby={labelledBy}>
      <div className="shell-side">
        {pills}
        {side}
      </div>
      <div className={secondary ? 'shell-main shell-main--split' : 'shell-main'}>
        <div className="shell-pane">{primary}</div>
        {secondary && <div className="shell-pane">{secondary}</div>}
      </div>
    </Root>
  )
}
