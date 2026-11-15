import type { ReadingSource } from '../domain/ports'
import type { DeviceLink } from '../infrastructure/DeviceLink'
import type { DotFeed, DotFeedListener } from './DotFeed'
import { validPct } from './dotDisplay'

/** The firmware's server mode: values from the device link topic's payloads `{id, t, pct, level, src, metrics}`,
 *  published by the backend as `backend-rules`; only `pct` is read. A payload without a pct from 0 to 100 is ignored
 *  and the last value stays. */
export class LinkFeed implements DotFeed {
  readonly simulated = false

  constructor(
    private readonly link: Pick<DeviceLink, 'onState'>,
    private readonly source: ReadingSource,
  ) {}

  start(listener: DotFeedListener): () => void {
    const stopState = this.link.onState((state) => listener.link(state === 'connected'))
    const stopValues = this.source.subscribe((payload) => {
      if (typeof payload !== 'object' || payload === null || !Object.hasOwn(payload, 'pct')) return
      const pct: unknown = (payload as Record<string, unknown>).pct
      if (validPct(pct)) listener.value(pct)
    })
    return () => {
      stopState()
      stopValues()
    }
  }
}
