import { DEVICES } from '../domain/devices'
import { SIM_CONFIG, SIM_DEVICES } from './simDevices'

describe('SIM_DEVICES', () => {
  it('covers every gateway device, in mockup 04 order', () => {
    expect(SIM_DEVICES.map((s) => s.name)).toEqual(['Pulse oximeter', 'Wrist bracelet', 'BP cuff', 'Thermometer', 'Environment node', 'Dosimeter'])
    expect(SIM_DEVICES.map((s) => s.device.id).sort()).toEqual(DEVICES.map((d) => d.id).sort())
  })

  it('#43 AC13: a sim field is its device field and a label only', () => {
    expect(SIM_DEVICES[0].fields).toEqual([
      { field: DEVICES[0].fields[0], label: 'SpO₂' },
      { field: DEVICES[0].fields[1], label: 'Pulse' },
    ])
  })
})

describe('SIM_CONFIG', () => {
  it('#43 AC30: every device starts nominal, one message a second', () => {
    expect(SIM_CONFIG).toEqual(Object.fromEntries(DEVICES.map((d) => [d.id, { everyS: 1, level: 'nominal' }])))
  })
})
