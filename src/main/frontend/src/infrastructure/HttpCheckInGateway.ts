import type { CheckIn } from '../domain/checkIn'
import type { CheckInGateway } from '../domain/ports'

export class HttpCheckInGateway implements CheckInGateway {
  constructor(
    private readonly baseUrl = '',
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async send(checkIns: CheckIn[]): Promise<string[]> {
    const response = await this.fetchFn(`${this.baseUrl}/api/checkins/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIns }),
    })
    if (!response.ok) throw new Error(`Sync failed with status ${response.status}`)
    const body: { acceptedIds: string[] } = await response.json()
    return body.acceptedIds
  }
}
