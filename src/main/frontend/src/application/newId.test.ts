import { newId } from './newId'

describe('newId', () => {
  it('AC11: uses randomUUID when the context has it', () => {
    const crypto = { randomUUID: () => 'from-random-uuid', getRandomValues: vi.fn() } as unknown as Crypto

    expect(newId(crypto)).toBe('from-random-uuid')
  })

  it('AC11: builds a v4 UUID from getRandomValues outside a secure context', () => {
    const crypto = { getRandomValues: <T extends ArrayBufferView>(bytes: T) => bytes } as unknown as Crypto

    expect(newId(crypto)).toBe('00000000-0000-4000-8000-000000000000')
  })

  it('AC11: the fallback keeps the version and variant bits with all-ones bytes', () => {
    const crypto = { getRandomValues: (bytes: Uint8Array) => bytes.fill(0xff) } as unknown as Crypto

    expect(newId(crypto)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
  })
})
