/** `crypto.randomUUID` exists only in secure contexts; a tablet at http://<LAN IP> falls back to `getRandomValues`. */
export function newId(c: Crypto = crypto): string {
  if (typeof c.randomUUID === 'function') return c.randomUUID()
  const bytes = c.getRandomValues(new Uint8Array(16))
  bytes[6] = 0x40 | (bytes[6] & 0x0f)
  bytes[8] = 0x80 | (bytes[8] & 0x3f)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
