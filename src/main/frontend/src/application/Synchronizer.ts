export interface Synchronizer {
  sync(): Promise<void>
  subscribe(listener: () => void): () => void
}
