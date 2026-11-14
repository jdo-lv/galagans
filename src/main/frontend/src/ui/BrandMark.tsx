// Canvas brand ring: track in the ring colour, short arc in the accent (red on the canvas, blue here: red means warning).
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path d="M24.83 12.09 A11 11 0 1 1 10.24 3.66" fill="none" stroke="var(--color-ring)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 3 A11 11 0 0 1 23.53 8.5" fill="none" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
