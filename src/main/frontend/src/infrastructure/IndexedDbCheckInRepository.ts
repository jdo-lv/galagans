import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CheckIn } from '../domain/checkIn'
import type { CheckInRepository } from '../domain/ports'

type SyncStatus = 'pending' | 'synced'
type StoredCheckIn = CheckIn & { syncStatus: SyncStatus }

interface CrewHealthDb extends DBSchema {
  checkIns: {
    key: string
    value: StoredCheckIn
    indexes: { bySyncStatus: SyncStatus }
  }
}

const STORE = 'checkIns'

export class IndexedDbCheckInRepository implements CheckInRepository {
  private db: Promise<IDBPDatabase<CrewHealthDb>>

  constructor(dbName = 'crew-health') {
    this.db = openDB<CrewHealthDb>(dbName, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('bySyncStatus', 'syncStatus')
      },
    })
  }

  async add(checkIn: CheckIn): Promise<void> {
    await (await this.db).put(STORE, { ...checkIn, syncStatus: 'pending' })
  }

  async listPending(): Promise<CheckIn[]> {
    const stored = await (await this.db).getAllFromIndex(STORE, 'bySyncStatus', 'pending')
    return stored.map(({ syncStatus: _syncStatus, ...checkIn }) => checkIn)
  }

  async countPending(): Promise<number> {
    return (await this.db).countFromIndex(STORE, 'bySyncStatus', 'pending')
  }

  async markSynced(ids: string[]): Promise<void> {
    const tx = (await this.db).transaction(STORE, 'readwrite')
    for (const id of ids) {
      const stored = await tx.store.get(id)
      if (stored) await tx.store.put({ ...stored, syncStatus: 'synced' })
    }
    await tx.done
  }
}
