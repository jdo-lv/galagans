import { deviceLinkUrl } from './deviceLinkUrl'

describe('deviceLinkUrl', () => {
  it('AC5: uses the page host, ws: on http and wss: on https', () => {
    expect(deviceLinkUrl({ protocol: 'http:', host: '192.168.1.20:8080' })).toBe('ws://192.168.1.20:8080/ws/devices')
    expect(deviceLinkUrl({ protocol: 'https:', host: 'example.org' })).toBe('wss://example.org/ws/devices')
  })
})
