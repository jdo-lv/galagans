export type DeviceRoute = 'simulation' | 'websocket'

/** The hidden device screen's two paths: /device/simulation (the scenario on a loop) and /device/websocket. */
export function deviceRoute(pathname: string): DeviceRoute | undefined {
  const match = /^\/device\/(simulation|websocket)\/?$/.exec(pathname)
  return match ? (match[1] as DeviceRoute) : undefined
}
