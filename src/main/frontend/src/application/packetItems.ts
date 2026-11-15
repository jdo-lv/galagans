import type { PacketItem } from '../domain/packet'
import type { LatestReading } from '../domain/readings'
import { isFlagged } from '../domain/rules'

/** A "Latest readings" row as a packet item; only the fields that have a value. */
export function toPacketItem(reading: LatestReading): PacketItem {
  const { spec, state, value, text, recordedAt, source, rule, unrated } = reading
  return {
    key: spec.key,
    label: spec.labelSuffix ? `${spec.label} ${spec.labelSuffix}` : spec.label,
    unit: spec.unit,
    // No rule judged it, so it is not nominal.
    state: state === 'nominal' && unrated ? 'unrated' : state,
    ...(value !== undefined && { value }),
    ...(text !== undefined && { text }),
    ...(recordedAt !== undefined && { recordedAt }),
    ...(source !== undefined && { source }),
    ...(rule && isFlagged(state) && { ruleId: rule.id, tier: rule.tier }),
  }
}
