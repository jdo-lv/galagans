import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PacketItem, StoredPacket } from '../domain/packet'
import { clickBarLink, setup } from '../test/renderApp'

// Local times, so the tests pass in any TZ.
const at = (h: number, m: number, s = 0, day = 14) => new Date(2026, 10, day, h, m, s)
const load = (hash: string) => window.history.replaceState(null, '', hash)

const item = (key: string, state: PacketItem['state']): PacketItem => ({ key, label: key, unit: '', state })
const storedPacket = (fields: Partial<StoredPacket> & Pick<StoredPacket, 'id' | 'builtAt'>): StoredPacket => ({
  oneWayDelayMs: 845_000,
  note: '',
  items: [],
  state: 'queued',
  ...fields,
})

type Setup = ReturnType<typeof setup>

/** Opens #/ground at `now` with `packets` stored, once the history has left its loading state. */
async function openGround(now: Date, packets: StoredPacket[] = [], before: (s: Setup) => void = () => {}) {
  load('#/ground')
  const s = setup({ now: now.toISOString() })
  packets.forEach((p) => s.packets.items.set(p.id, p))
  before(s)
  s.renderApp()
  await waitFor(() => expect(within(history()).queryByText(/No packets sent yet|Packet history unavailable/) ?? within(history()).queryByRole('table')).not.toBeNull())
  return s
}

const ground = () => screen.getByRole('region', { name: 'Ground' })
const history = () => within(ground()).getByRole('region', { name: 'Packet history' })
const bodyRows = () => within(history()).getAllByRole('row').slice(1)
/** Each cell's text, the row header first. */
const cells = (row: HTMLElement) => [...row.children].map((cell) => cell.textContent)
const deliveryCell = () => bodyRows()[0].children[1]

const SENT_0756 = storedPacket({ id: 'p', builtAt: at(7, 55).toISOString(), state: 'sent', sentAt: at(7, 56).toISOString() })

afterEach(() => {
  vi.useRealTimers()
})

describe('Ground history (#57)', () => {
  it('AC11: Ground with no packet: heading, privacy line, New surgeon packet, then an empty history', async () => {
    setup().renderApp()

    await clickBarLink('Ground')

    const region = await screen.findByRole('region', { name: 'Ground' })
    expect(window.location.hash).toBe('#/ground')
    const heading = within(region).getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/^Ground$/)
    await waitFor(() => expect(document.activeElement).toBe(heading))
    const privacy = within(region).getByText('Shared with flight medicine only').closest('p') as HTMLElement
    expect(privacy).toHaveClass('muted')
    expect(privacy.textContent).toBe('Shared with flight medicine only')
    const lock = privacy.querySelector('svg') as Element
    expect(lock).toHaveClass('tabler-icon-lock')
    expect(lock).toHaveAttribute('width', '18')
    const newPacket = within(region).getByRole('link', { name: 'New surgeon packet' })
    expect(newPacket).toHaveAttribute('href', '#/packet')
    expect(newPacket).toHaveClass('button-primary')
    const card = within(region).getByRole('region', { name: 'Packet history' })
    expect(card.tagName).toBe('SECTION')
    expect(card).toHaveClass('card')
    const cardHeading = within(card).getByRole('heading', { level: 3 })
    expect(cardHeading).toHaveClass('card-heading')
    expect(cardHeading).toHaveTextContent(/^Packet history$/)
    expect(card).toHaveAttribute('aria-labelledby', cardHeading.id)
    const empty = await within(card).findByText('No packets sent yet.')
    expect(empty.tagName).toBe('P')
    expect(empty).toHaveClass('muted')
    expect(within(card).queryByRole('table')).toBeNull()
    for (const [before, after] of [
      [heading, privacy],
      [privacy, newPacket],
      [newPacket, card],
    ]) {
      expect(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(screen.queryByRole('link', { name: '← Home' })).toBeNull()
  })

  it('AC12: one row per packet, newest first, with built time, delivery, contents and crew note', async () => {
    await openGround(at(8, 0), [
      storedPacket({
        id: 'old',
        builtAt: at(7, 0).toISOString(),
        items: [item('spo2', 'nominal'), item('heartRate', 'check')],
        note: 'Headache since wake-up',
        state: 'sent',
        sentAt: at(7, 1).toISOString(),
      }),
      storedPacket({ id: 'new', builtAt: at(7, 50).toISOString(), items: [item('spo2', 'nominal')] }),
    ])

    const tables = history().querySelectorAll('table')
    expect(tables).toHaveLength(1)
    expect(tables[0]).toHaveClass('packet-table')
    expect(within(history()).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Built', 'Delivery', 'Contents', 'Crew note'])
    const rows = bodyRows()
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      const [first, ...rest] = [...row.children]
      expect(first.tagName).toBe('TH')
      expect(first).toHaveAttribute('scope', 'row')
      expect(first).toHaveClass('num')
      expect(rest.map((cell) => cell.tagName)).toEqual(['TD', 'TD', 'TD'])
    }
    expect(cells(rows[0])).toEqual(['14 Nov 07:50', 'Queued, waits for ground link', '1 item', 'No note'])
    expect(rows[0].children[3].querySelector('span.muted')).toHaveTextContent(/^No note$/)
    expect(cells(rows[1])).toEqual(['14 Nov 07:00', 'Sent 14 Nov 07:01 · arrived ~07:15', '2 items · 1 flagged', 'Headache since wake-up'])
  })

  it('AC13: 0 items reads "0 items" and a 500-character note shows whole', async () => {
    const note = 'A'.repeat(499) + 'Z'
    await openGround(at(8, 0), [storedPacket({ id: 'p', builtAt: at(7, 0).toISOString(), note })])

    const [, , contents, crewNote] = cells(bodyRows()[0])

    expect(contents).toBe('0 items')
    expect(crewNote).toBe(note)
  })

  it('AC14: a sent packet before its arrival time reads "arrives ~08:10"', async () => {
    await openGround(at(8, 0), [SENT_0756])

    expect(deliveryCell().textContent).toBe('Sent 14 Nov 07:56 · arrives ~08:10')
  })

  it('AC15: when the uplink sends a queued packet, its row moves on without leaving Ground', async () => {
    const s = await openGround(at(8, 0), [storedPacket({ id: 'p', builtAt: at(7, 58).toISOString() })])
    expect(deliveryCell().textContent).toBe('Queued, waits for ground link')

    await act(() => s.packetUplink.sync())

    await waitFor(() => expect(deliveryCell().textContent).toBe('Sent 14 Nov 08:00 · arrives ~08:14'))
    expect(window.location.hash).toBe('#/ground')
  })

  it('AC16: the 60 s re-read turns "arrives" into "arrived"', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = await openGround(at(8, 0), [SENT_0756])

    s.clock.now = at(8, 11)
    act(() => vi.advanceTimersByTime(60_000))

    await waitFor(() => expect(deliveryCell().textContent).toBe('Sent 14 Nov 07:56 · arrived ~08:10'))
  })

  it('AC17: a failed read says "Packet history unavailable" and keeps the rest of the screen', async () => {
    await openGround(at(8, 0), [SENT_0756], (s) => {
      s.packets.failListAll = true
    })

    const unavailable = within(history()).getByText('Packet history unavailable')
    expect(unavailable.tagName).toBe('P')
    expect(unavailable).toHaveClass('muted')
    expect(unavailable.textContent).toBe('Packet history unavailable')
    expect(within(history()).queryByRole('table')).toBeNull()
    expect(within(ground()).getByRole('heading', { level: 2, name: 'Ground' })).toBeInTheDocument()
    expect(within(ground()).getByText('Shared with flight medicine only')).toBeInTheDocument()
    expect(within(ground()).getByRole('link', { name: 'New surgeon packet' })).toBeInTheDocument()
  })

  it('AC18: the ground-link pill is current only on #/packet, where Ground is current too', async () => {
    const pill = () => screen.getByRole('link', { name: /^Surgeon packet\./ })
    const groundLink = () => within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Ground' })
    await openGround(at(8, 0))

    expect(pill()).not.toHaveAttribute('aria-current')

    await userEvent.click(within(ground()).getByRole('link', { name: 'New surgeon packet' }))

    await screen.findByRole('heading', { level: 2, name: 'Surgeon packet' })
    expect(window.location.hash).toBe('#/packet')
    expect(pill()).toHaveAttribute('aria-current', 'page')
    expect(groundLink()).toHaveAttribute('aria-current', 'true')
  })
})
