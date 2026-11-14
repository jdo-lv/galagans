import type { CheckIn, CheckInDraft } from '../domain/checkIn'
import type { CheckInRepository } from '../domain/ports'
import type { Synchronizer } from './Synchronizer'

export interface CheckInRecording {
  record(draft: CheckInDraft): Promise<CheckIn>
}

export class CheckInRecorder implements CheckInRecording {
  constructor(
    private readonly repository: CheckInRepository,
    private readonly synchronizer: Synchronizer,
    private readonly newId: () => string = () => crypto.randomUUID(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async record(draft: CheckInDraft): Promise<CheckIn> {
    const checkIn: CheckIn = { ...draft, id: this.newId(), recordedAt: this.now().toISOString() }
    await this.repository.add(checkIn)
    void this.synchronizer.sync()
    return checkIn
  }
}
