import { deviceLinkUrl } from './deviceLinkUrl'

export type LinkState = 'connecting' | 'connected' | 'disconnected'

const RECONNECT_MS = 5_000

/** One WebSocket to the device relay. Reconnects every 5 s and never queues a frame, so a reading is sent now or never. */
export class DeviceLink {
  private state: LinkState = 'disconnected'
  private socket: WebSocket | null = null
  private started = false
  private readonly frameListeners = new Set<(frame: string) => void>()
  private readonly stateListeners = new Set<(state: LinkState) => void>()

  constructor(
    readonly url: string = deviceLinkUrl(),
    private readonly WebSocketCtor: typeof WebSocket = WebSocket,
  ) {}

  start(): void {
    if (this.started) return
    this.started = true
    this.connect()
  }

  send(frame: string): boolean {
    if (this.state !== 'connected' || !this.socket) return false
    this.socket.send(frame)
    return true
  }

  onFrame(listener: (frame: string) => void): () => void {
    this.frameListeners.add(listener)
    return () => this.frameListeners.delete(listener)
  }

  onState(listener: (state: LinkState) => void): () => void {
    this.stateListeners.add(listener)
    listener(this.state)
    return () => this.stateListeners.delete(listener)
  }

  private connect(): void {
    let socket: WebSocket
    try {
      socket = new this.WebSocketCtor(this.url)
    } catch {
      this.retry()
      return
    }
    this.socket = socket
    this.setState('connecting')
    socket.onopen = () => this.setState('connected')
    socket.onclose = () => {
      this.socket = null
      this.setState('disconnected')
      this.retry()
    }
    socket.onerror = () => {}
    socket.onmessage = (event) => {
      const data: unknown = event.data
      if (typeof data === 'string') this.frameListeners.forEach((listener) => listener(data))
    }
  }

  private retry(): void {
    setTimeout(() => this.connect(), RECONNECT_MS)
  }

  private setState(state: LinkState): void {
    if (state === this.state) return
    this.state = state
    this.stateListeners.forEach((listener) => listener(state))
  }
}
