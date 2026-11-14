import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CheckIn } from '../domain/checkIn'
import type { CheckInHistory, CheckInRepository } from '../domain/ports'

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

const withoutSyncStatus = ({ syncStatus: _syncStatus, ...checkIn }: StoredCheckIn): CheckIn => checkIn

export class IndexedDbCheckInRepository implements CheckInRepository, CheckInHistory {
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

  async list(): Promise<CheckIn[]> {
    return (await (await this.db).getAll(STORE)).map(withoutSyncStatus)
  }

  async listPending(): Promise<CheckIn[]> {
    return (await (await this.db).getAllFromIndex(STORE, 'bySyncStatus', 'pending')).map(withoutSyncStatus)
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
