import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CheckIn } from '../domain/checkIn'
import { READINGS, type ReadingPlaceholder } from '../domain/readings'
import { toPacketItem } from '../application/packetItems'
import { mockReadings } from '../infrastructure/mockReadings'
import { setup } from '../test/renderApp'

// Local times, so the tests pass in any TZ.
const at = (h: number, m: number, s = 0, day = 14) => new Date(2026, 10, day, h, m, s)
const go = (hash: string) => window.history.replaceState(null, '', hash)

type Options = { now?: Date; seed?: CheckIn[]; online?: boolean; readingPlaceholders?: ReadingPlaceholder[] }
const setupAt = ({ now = at(7, 31), ...rest }: Options = {}) => setup({ ...rest, now: now.toISOString() })

const PILL_NAME = 'Surgeon packet. Ground link: one-way delay 14 min 05 s (demo)'
const pill = () => screen.getByRole('link', { name: PILL_NAME })
const heading = () => screen.getByRole('heading', { level: 2, name: 'Surgeon packet' })

const MIN = 60_000
const NOW = at(7, 31)
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * MIN).toISOString()
const stored = (id: string, recordedAt: string, fields: Partial<CheckIn>): CheckIn => ({ id, recordedAt, symptoms: [], ...fields })

type Setup = ReturnType<typeof setupAt>

async function openPacket(options: Options = {}, before: (s: Setup) => void = () => {}) {
  go('#/packet')
  const s = setupAt(options)
  before(s)
  s.renderApp()
  await screen.findByRole('heading', { level: 2, name: 'Surgeon packet' })
  return s
}

const contents = () => screen.getByRole('region', { name: 'Next packet · contents' })
const sendButton = () => screen.getByRole('button', { name: 'Send packet' })

async function openWithContents(options: Options = {}, before?: (s: Setup) => void) {
  const s = await openPacket(options, before)
  await within(contents()).findByRole('table')
  return s
}

const note = () => screen.getByRole('textbox', { name: 'Crew note (optional)' }) as HTMLTextAreaElement
const noteCard = () => screen.getByRole('region', { name: 'Crew note (optional)' })
const confirmButton = () => screen.getByRole('button', { name: /^Confirm send/ })
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Status, Value and Source cells of the row whose Item is `label`. */
function cells(label: string) {
  const header = within(contents()).getByRole('rowheader', { name: label })
  const [status, value, source] = [...header.closest('tr')!.querySelectorAll('td')] as HTMLElement[]
  return { status, value, source }
}

afterEach(() => {
  vi.useRealTimers()
  go('/')
})

describe('Ground-link pill and route', () => {
  it.each([
    ['#/', undefined],
    ['#/systems/Respiratory', undefined],
    ['#/packet', 'page'],
  ])('AC1, AC3: on %s the ground-link pill links to #/packet beside the sync pill (aria-current %s)', async (hash, current) => {
    go(hash)
    setupAt().renderApp()

    const link = pill()
    expect(link.tagName).toBe('A')
    expect(link).toHaveClass('pill', 'pill--link')
    expect(link).toHaveAttribute('href', '#/packet')
    expect(link).toHaveTextContent('Ground link: one-way delay 14 min 05 s (demo)')
    expect(link.querySelector('svg.tabler-icon-satellite')).not.toBeNull()
    expect(link.parentElement).toContainElement(screen.getByRole('status'))
    if (current) expect(link).toHaveAttribute('aria-current', current)
    else expect(link).not.toHaveAttribute('aria-current')
  })

  it('AC3: #/packet shows the heading, focused once, and a ← Home link', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    await openPacket()

    expect(heading()).toHaveAttribute('tabindex', '-1')
    expect(heading()).toHaveFocus()
    const home = screen.getByRole('link', { name: '← Home' })
    expect(home).toHaveAttribute('href', '#/')
    expect(screen.queryByRole('region', { name: 'Body systems' })).toBeNull()

    home.focus()
    act(() => vi.advanceTimersByTime(60_000))
    await act(async () => {})
    expect(home).toHaveFocus()
  })

  it('AC3: following the pill from Home opens the packet screen', async () => {
    go('#/')
    setupAt().renderApp()

    await userEvent.click(pill())

    expect(await screen.findByRole('heading', { level: 2, name: 'Surgeon packet' })).toHaveFocus()
    expect(window.location.hash).toBe('#/packet')
  })

  it('AC4: #/packet/x goes Home', async () => {
    go('#/packet/x')
    setupAt().renderApp()

    expect(await screen.findByRole('region', { name: 'Body systems' })).toBeInTheDocument()
    await waitFor(() => expect(window.location.hash).toBe('#/'))
    expect(screen.queryByRole('heading', { name: 'Surgeon packet' })).toBeNull()
  })

  it('AC5: ← Home returns Home and focuses the Body systems heading', async () => {
    await openPacket()

    await userEvent.click(screen.getByRole('link', { name: '← Home' }))

    const systems = await screen.findByRole('heading', { name: 'Body systems' })
    await waitFor(() => expect(systems).toHaveFocus())
  })

  it('AC6: privacy line with the lock icon', async () => {
    await openPacket()

    const line = screen.getByText('Shared with flight medicine only · Mars transit, one-way delay 14 min 05 s (demo value)')
    expect(line.closest('div, p')?.querySelector('svg.tabler-icon-lock')).not.toBeNull()
  })
})

describe('Next packet contents', () => {
  it('AC7: a table with Item, Status, Value and Source, one row per reading in order', async () => {
    await openWithContents()

    const table = within(contents()).getByRole('table')
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Item', 'Status', 'Value', 'Source'])
    expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(
      READINGS.map((spec) => (spec.labelSuffix ? `${spec.label} ${spec.labelSuffix}` : spec.label)),
    )
    expect(within(table).getByRole('rowheader', { name: 'Cabin CO₂ (1-h avg)' })).toBeInTheDocument()
  })

  it('AC8: SpO₂ 92 from 10 min ago → caution badge, rule tag, CMO pill, value with age, manual', async () => {
    await openWithContents({ seed: [stored('a', ago(10), { spo2Percent: 92 })] })

    const { status, value, source } = cells('SpO₂')
    expect(within(status).getByText('▲ CAUTION')).toHaveClass('badge', 'badge--caution')
    expect(within(status).getByText('rule · SPO-01')).toHaveClass('tag', 'tag--rule')
    const tier = within(status).getByText('CMO')
    expect(tier).toHaveClass('pill')
    expect(tier).not.toHaveClass('tag')
    expect(value).toHaveTextContent('92 %')
    expect(value).toHaveTextContent('10 min ago')
    expect(within(source).getByText('manual')).toHaveClass('tag')
  })

  it('AC9: SpO₂ 88 → warning badge, SPO-02 and "Urgent ground"', async () => {
    await openWithContents({ seed: [stored('a', ago(10), { spo2Percent: 88 })] })

    const { status } = cells('SpO₂')
    expect(within(status).getByText('WARNING').closest('.badge')).toHaveClass('badge--warning')
    expect(within(status).getByText('rule · SPO-02')).toHaveClass('tag--rule')
    expect(within(status).getByText('Urgent ground')).toHaveClass('pill')
  })

  it('AC10: SpO₂ 96 → nominal badge, no rule tag or tier pill', async () => {
    await openWithContents({ seed: [stored('a', ago(10), { spo2Percent: 96 })] })

    const { status } = cells('SpO₂')
    expect(within(status).getByText('✓ Nominal')).toHaveClass('badge--nominal')
    expect(status.querySelector('.tag, .pill')).toBeNull()
  })

  it('AC11: SpO₂ 92 from 25 h ago → "No recent data", "data 1 d old", no rule tag or tier pill', async () => {
    await openWithContents({ seed: [stored('a', ago(25 * 60), { spo2Percent: 92 })] })

    const { status, value } = cells('SpO₂')
    expect(within(status).getByText('No recent data')).toHaveClass('badge--quiet')
    expect(value).toHaveTextContent('92 %')
    expect(value).toHaveTextContent('data 1 d old')
    expect(status.querySelector('.tag, .pill')).toBeNull()
  })

  it.each([
    ['Heart rate', { heartRateBpm: 63 }, '63 bpm', 'manual'],
    ['Sleep', { sleepHours: 7 }, '7 h', 'manual'],
    ['Mood', { mood: 3 }, '3 / 5', 'manual'],
    ['Reaction time', { pvtMedianMs: 268, pvtLapses: 0, pvtFalseStarts: 0 }, '268 ms', 'in-app test'],
  ])('AC12: %s with no rule rows is "—" Not rated, with value, age and source', async (label, fields, shown, source) => {
    await openWithContents({ seed: [stored('a', ago(10), fields)] })

    const row = cells(label)
    expect(within(row.status).getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(within(row.status).getByText('Not rated')).toHaveClass('visually-hidden')
    expect(row.status.querySelector('.badge')).toBeNull()
    expect(row.value).toHaveTextContent(shown)
    expect(row.value).toHaveTextContent('10 min ago')
    expect(within(row.source).getByText(source)).toHaveClass('tag')
  })

  it('AC13: no sleep reading → "—" No reading, the No data badge and no source tag', async () => {
    await openWithContents()

    const { status, value, source } = cells('Sleep')
    expect(within(status).getByText('No data')).toHaveClass('badge--quiet')
    expect(within(value).getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(within(value).getByText('No reading')).toHaveClass('visually-hidden')
    expect(source.querySelector('.tag')).toBeNull()
  })

  it.each([
    ['Blood pressure', '108/70 mmHg'],
    ['Cabin CO₂ (1-h avg)', '2.3 mmHg'],
  ])('AC14: synthetic %s → "—" No status, %s, no age, tag synthetic', async (label, shown) => {
    await openWithContents({ readingPlaceholders: mockReadings })

    const { status, value, source } = cells(label)
    expect(within(status).getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(within(status).getByText('No status')).toHaveClass('visually-hidden')
    expect(value).toHaveTextContent(shown)
    expect(value).not.toHaveTextContent(/ago|old/)
    expect(within(source).getByText('synthetic')).toHaveClass('tag')
  })

  it.each([
    ['the rules', (s: Setup) => (s.ruleSource.fail = true)],
    ['the check-in store', (s: Setup) => (s.repository.failList = true)],
  ])('AC15: when %s fail to load, the contents are unavailable and Send packet is disabled', async (_, fail) => {
    await openPacket({}, fail)

    expect(await within(contents()).findByText('Packet contents unavailable')).toBeInTheDocument()
    expect(within(contents()).queryByRole('table')).toBeNull()
    expect(sendButton()).toBeDisabled()
  })

  it('AC16: Send packet is disabled while the contents load, then enabled', async () => {
    let release!: () => void
    await openPacket({}, (s) => {
      const read = s.readingsReader.read.bind(s.readingsReader)
      vi.spyOn(s.readingsReader, 'read').mockImplementationOnce(() => new Promise((resolve) => (release = () => resolve(read()))))
    })

    expect(sendButton()).toBeDisabled()
    act(() => release())
    await waitFor(() => expect(sendButton()).toBeEnabled())
  })

  it('AC16: Send packet is enabled when every row is No data and the note is empty', async () => {
    await openWithContents()

    expect(sendButton()).toBeEnabled()
  })

  it('AC17: the contents re-read every 60 s', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = await openWithContents({ seed: [stored('a', ago(10), { spo2Percent: 96 })] })
    expect(within(cells('SpO₂').status).getByText('✓ Nominal')).toBeInTheDocument()

    s.clock.now = at(7, 32)
    s.repository.items.set('b', { checkIn: stored('b', at(7, 32).toISOString(), { spo2Percent: 92 }), pending: false })
    act(() => vi.advanceTimersByTime(60_000))

    expect(await within(contents()).findByText('▲ CAUTION')).toBeInTheDocument()
    expect(cells('SpO₂').value).toHaveTextContent('just now')
  })
})

describe('Crew note and send', () => {
  it('AC18: the counter shows the untrimmed length and the note stops at 500', async () => {
    await openWithContents()
    const user = userEvent.setup({ delay: null })

    expect(note()).toHaveAttribute('maxlength', '500')
    expect(within(noteCard()).getByText('0 / 500')).toBeInTheDocument()
    await user.type(note(), '  ab  ')
    expect(within(noteCard()).getByText('6 / 500')).toBeInTheDocument()

    await user.clear(note())
    await user.type(note(), 'x'.repeat(501))
    expect(note().value).toHaveLength(500)
    expect(within(noteCard()).getByText('500 / 500')).toBeInTheDocument()
  })

  it('AC19: online at 07:31, Send packet asks "Confirm send · arrives ~07:45" with focus, and Cancel; nothing is stored', async () => {
    const s = await openWithContents()

    await userEvent.click(sendButton())

    const confirm = screen.getByRole('button', { name: 'Confirm send · arrives ~07:45' })
    expect(confirm).toHaveClass('button-primary')
    expect(confirm).toHaveFocus()
    expect(cancelButton()).toHaveClass('button-secondary')
    expect(screen.queryByRole('button', { name: 'Send packet' })).toBeNull()
    expect(s.packets.items.size).toBe(0)
  })

  it('AC19: offline, the confirm text is "Confirm send · waits for ground link"', async () => {
    await openWithContents({ online: false })

    await userEvent.click(sendButton())

    expect(confirmButton()).toHaveAccessibleName('Confirm send · waits for ground link')
  })

  it('AC19: the confirm text is fixed at the click, whatever the clock or the connection do', async () => {
    const s = await openWithContents()
    await userEvent.click(sendButton())

    s.clock.now = at(7, 40)
    act(() => s.connectivity.set(false))

    expect(screen.getByRole('status')).toHaveTextContent('Offline')
    expect(confirmButton()).toHaveAccessibleName('Confirm send · arrives ~07:45')
  })

  it('AC20: Cancel brings Send packet back with focus, keeps the note and stores nothing', async () => {
    const s = await openWithContents()
    await userEvent.type(note(), 'Headache')
    await userEvent.click(sendButton())

    await userEvent.click(cancelButton())

    expect(sendButton()).toHaveFocus()
    expect(note()).toHaveValue('Headache')
    expect(screen.queryByRole('button', { name: /^Confirm send/ })).toBeNull()
    expect(s.packets.items.size).toBe(0)
  })

  it('AC21: offline, Confirm send stores one queued packet with the trimmed note and the readings, then resets', async () => {
    const s = await openWithContents({ online: false, seed: [stored('a', ago(10), { spo2Percent: 92 })], readingPlaceholders: mockReadings })
    await userEvent.type(note(), '  Slept badly.  ')
    await userEvent.click(sendButton())
    const items = (await s.readingsReader.read()).map(toPacketItem)

    await userEvent.click(confirmButton())

    await waitFor(() => expect(sendButton()).toHaveFocus())
    const packets = [...s.packets.items.values()]
    expect(packets).toEqual([
      { id: expect.stringMatching(UUID), builtAt: at(7, 31).toISOString(), oneWayDelayMs: 845_000, note: 'Slept badly.', items, state: 'queued' },
    ])
    expect(items.find((i) => i.key === 'spo2')).toMatchObject({ state: 'caution', ruleId: 'SPO-01', tier: 'CMO' })
    expect(note()).toHaveValue('')
    expect(within(noteCard()).getByText('0 / 500')).toBeInTheDocument()
  })

  it('AC22: Confirm send and Cancel are disabled while saving, and a double click stores one packet', async () => {
    const s = await openWithContents({ online: false })
    let release!: () => void
    const add = s.packets.add.bind(s.packets)
    vi.spyOn(s.packets, 'add').mockImplementation((p) => new Promise((resolve) => (release = () => resolve(add(p)))))
    await userEvent.click(sendButton())

    await userEvent.dblClick(confirmButton())
    await waitFor(() => expect(s.packets.add).toHaveBeenCalled())

    expect(confirmButton()).toBeDisabled()
    expect(cancelButton()).toBeDisabled()
    await act(async () => release())
    await waitFor(() => expect(sendButton()).toHaveFocus())
    expect(s.packets.add).toHaveBeenCalledTimes(1)
    expect(s.packets.items.size).toBe(1)
  })

  it.each([
    ['the packet store rejects', (s: Setup) => (s.packets.failAdd = true)],
    ['the readings fail to load at confirm', (s: Setup) => (s.ruleSource.fail = true)],
  ])('AC24: when %s, "Packet not saved. Try again." shows under the buttons; the note stays; nothing is stored', async (_, fail) => {
    const s = await openWithContents()
    await userEvent.type(note(), 'Headache')
    await userEvent.click(sendButton())
    fail(s)

    await userEvent.click(confirmButton())

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Packet not saved. Try again.')
    expect(sendButton().compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(sendButton()).toHaveFocus()
    expect(note()).toHaveValue('Headache')
    expect(s.packets.items.size).toBe(0)

    await userEvent.click(sendButton())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('AC15: contents failing during the confirm step disable Confirm send', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const s = await openWithContents()
    await userEvent.click(sendButton())

    s.ruleSource.fail = true
    act(() => vi.advanceTimersByTime(60_000))

    expect(await within(contents()).findByText('Packet contents unavailable')).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
  })

  it('AC34: online, a confirmed packet is sent at once and marked sent', async () => {
    const s = await openWithContents()
    await userEvent.click(sendButton())

    await userEvent.click(confirmButton())

    await waitFor(() => expect(s.packetGateway.sent).toHaveLength(1))
    await waitFor(() => expect([...s.packets.items.values()][0]).toMatchObject({ state: 'sent', sentAt: at(7, 31).toISOString() }))
  })

  it('AC37: offline, a confirmed packet is not sent and stays queued', async () => {
    const s = await openWithContents({ online: false })
    await userEvent.click(sendButton())

    await userEvent.click(confirmButton())

    await waitFor(() => expect(s.packets.items.size).toBe(1))
    expect(s.packetGateway.calls).toBe(0)
    expect([...s.packets.items.values()][0].state).toBe('queued')
  })
})
