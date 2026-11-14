import { dismissSplash, SPLASH_FADE_MS } from './splash'

const splash = () => document.getElementById('splash')
const isLeaving = () => splash()?.classList.contains('splash--leaving')

describe('dismissSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="splash" class="splash"></div><div id="root"></div>'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('app drawn 400 ms after launch → splash stays until 1200 ms, then fades out and is removed', () => {
    dismissSplash(document, 400)

    vi.advanceTimersByTime(799)
    expect(isLeaving()).toBe(false)

    vi.advanceTimersByTime(1)
    expect(isLeaving()).toBe(true)

    vi.advanceTimersByTime(SPLASH_FADE_MS)
    expect(splash()).toBeNull()
    expect(document.getElementById('root')).not.toBeNull()
  })

  it('app drawn 2 s after launch → splash fades out straight away', () => {
    dismissSplash(document, 2000)

    vi.advanceTimersByTime(0)

    expect(isLeaving()).toBe(true)
  })

  it('page without a splash → nothing to remove, the app is left as it is', () => {
    document.body.innerHTML = '<div id="root"></div>'

    dismissSplash(document, 0)
    vi.runAllTimers()

    expect(document.body.innerHTML).toBe('<div id="root"></div>')
  })
})
