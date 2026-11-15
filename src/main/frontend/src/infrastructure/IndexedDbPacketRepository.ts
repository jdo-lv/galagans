import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Packet, StoredPacket } from '../domain/packet'
import type { PacketRepository } from '../domain/ports'

interface PacketDb extends DBSchema {
  packets: {
    key: string
    value: StoredPacket
    // ISO 8601 UTC strings of one length, so string order is time order.
    indexes: { byBuiltAt: string }
  }
}

const STORE = 'packets'

/** Its own database, so the check-in database and its upgrade code stay untouched. */
export class IndexedDbPacketRepository implements PacketRepository {
  private db: Promise<IDBPDatabase<PacketDb>>

  constructor(dbName = 'crew-health-packets') {
    this.db = openDB<PacketDb>(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('byBuiltAt', 'builtAt')
      },
    })
  }

  async add(packet: Packet): Promise<void> {
    await (await this.db).put(STORE, { ...packet, state: 'queued' })
  }

  async listQueued(): Promise<StoredPacket[]> {
    return (await (await this.db).getAllFromIndex(STORE, 'byBuiltAt')).filter((p) => p.state === 'queued')
  }

  async markSent(id: string, sentAt: string): Promise<void> {
    const tx = (await this.db).transaction(STORE, 'readwrite')
    const stored = await tx.store.get(id)
    if (stored) await tx.store.put({ ...stored, state: 'sent', sentAt })
    await tx.done
  }

  async latest(): Promise<StoredPacket | undefined> {
    const cursor = await (await this.db).transaction(STORE).store.index('byBuiltAt').openCursor(null, 'prev')
    return cursor?.value
  }

  async listAll(): Promise<StoredPacket[]> {
    return (await (await this.db).getAllFromIndex(STORE, 'byBuiltAt')).reverse()
  }
}
