import { deviceRoute } from './deviceRoute'

describe('deviceRoute', () => {
  it.each([
    ['/device/simulation', 'simulation'],
    ['/device/simulation/', 'simulation'],
    ['/device/websocket', 'websocket'],
    ['/device/websocket/', 'websocket'],
  ])('%s → %s', (path, route) => {
    expect(deviceRoute(path)).toBe(route)
  })

  it.each(['/device', '/device/', '/device.html', '/device/other', '/device/simulation/extra', '/'])('%s → none', (path) => {
    expect(deviceRoute(path)).toBeUndefined()
  })
})
