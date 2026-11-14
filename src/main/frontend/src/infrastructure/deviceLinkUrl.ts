/** The relay lives on the server that served the page, so a tablet at the machine's LAN IP reaches it there. */
export function deviceLinkUrl(location: Pick<Location, 'protocol' | 'host'> = window.location): string {
  const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${scheme}//${location.host}/ws/devices`
}
