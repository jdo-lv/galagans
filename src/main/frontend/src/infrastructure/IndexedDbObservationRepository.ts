import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Observation } from '../domain/observation'
import type { ObservationRepository } from '../domain/ports'

interface ObservationDb extends DBSchema {
  observations: { key: string; value: Observation }
}

const STORE = 'observations'

/** Its own database, so the check-in database (`crew-health`) keeps its schema. */
export class IndexedDbObservationRepository implements ObservationRepository {
  private readonly db: Promise<IDBPDatabase<ObservationDb>>

  constructor(dbName = 'crew-health-observations') {
    this.db = openDB<ObservationDb>(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      },
    })
  }

  async put(observation: Observation): Promise<void> {
    await (await this.db).put(STORE, observation)
  }

  async list(): Promise<Observation[]> {
    return (await this.db).getAll(STORE)
  }

  /** A cursor scan, so the store needs no time index (no schema change). */
  async deleteBefore(time: string): Promise<void> {
    const limit = Date.parse(time)
    const tx = (await this.db).transaction(STORE, 'readwrite')
    for (let cursor = await tx.store.openCursor(); cursor; cursor = await cursor.continue()) {
      if (Date.parse(cursor.value.effectiveDateTime) < limit) await cursor.delete()
    }
    await tx.done
  }
}
