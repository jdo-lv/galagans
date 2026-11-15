import { parseModes } from './modes'

describe('parseModes', () => {
  it.each([
    [{}, { demo: true, mock: false }],
    [{ VITE_DEMO_MODE: 'false', VITE_MOCK_MODE: 'true' }, { demo: false, mock: true }],
    [{ VITE_DEMO_MODE: 'true' }, { demo: true, mock: false }],
    [{ VITE_DEMO_MODE: '0' }, { demo: true, mock: false }],
    [{ VITE_MOCK_MODE: '1' }, { demo: true, mock: false }],
    [{ VITE_MOCK_MODE: 'TRUE' }, { demo: true, mock: false }],
  ])('AC20: %j → %j', (env, modes) => {
    expect(parseModes(env)).toEqual(modes)
  })
})
