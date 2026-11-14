import type { ReactNode } from 'react'

// Line icons from the design canvas (research/Health Palette Prototype.html): 24 × 24, currentColor, round caps.
function Icon({ size = 22, strokeWidth = 1.6, children }: { size?: number; strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function MoonIcon() {
  return (
    <Icon>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Icon>
  )
}

export function SunIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </Icon>
  )
}

export function HeartIcon() {
  return (
    <Icon>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </Icon>
  )
}

export function OxygenIcon() {
  return (
    <Icon>
      <path d="M10 3s-6 7-6 11a6 6 0 0 0 9 5.2" />
      <text x="13.5" y="19.5" fontSize="7.5" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Inter, sans-serif">
        O2
      </text>
    </Icon>
  )
}

export function MoodIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
      <path d="M8.5 14a4 4 0 0 0 7 0" />
    </Icon>
  )
}

export function CloudOffIcon() {
  return (
    <Icon size={18} strokeWidth={1.8}>
      <path d="M3 3l18 18M9.5 6.2A6 6 0 0 1 18 11h.5a3.5 3.5 0 0 1 2.2 6.2M16 19H7a4.5 4.5 0 0 1-1.6-8.7" />
    </Icon>
  )
}
