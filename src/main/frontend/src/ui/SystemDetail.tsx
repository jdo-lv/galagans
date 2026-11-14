import { useEffect, useId, useRef, type ReactNode } from 'react'
import { formatAge, formatStaleAge } from '../application/formatAge'
import type { SystemDetail as Detail } from '../domain/rules'
import './detail.css'
import { Badge } from './SystemStatusList'
import { TrendChart } from './TrendChart'
import { useSystemDetail } from './useSystemDetail'

// Escalation tiers (ideas/ui-guidelines.md §5 "Status badge"); a rule's tier selects one by exact match.
const TIERS = ['Self-care', 'CMO', 'Medical conference', 'Urgent ground']

function Card({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="card" aria-labelledby={id}>
      <h3 id={id} className="card-heading">
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailBody({ detail, now, headingRef }: { detail: Detail; now: Date; headingRef: React.Ref<HTMLHeadingElement> }) {
  const { status, rules, points } = detail
  const { rule, recordedAt } = status
  const age = recordedAt && (status.state === 'stale' ? formatStaleAge(recordedAt, now) : formatAge(recordedAt, now))

  const chart = (
    <Card title={`${rules[0].label} · last 7 days`}>
      {points.length > 0 ? (
        <TrendChart rules={rules} points={points} now={now} source={status.source} />
      ) : (
        <p className="muted">No readings in the last 7 days</p>
      )}
    </Card>
  )

  return (
    <>
      <div className="detail-head">
        <div className="detail-title">
          <Badge state={status.state} />
          <h2 ref={headingRef} tabIndex={-1} className="section-heading">
            {status.system}
          </h2>
        </div>
        {status.value !== undefined && (
          <div className="muted">
            {status.label} <span className="num">{status.value}</span> {`${status.unit} · ${age} · ${status.source}`}
          </div>
        )}
        {!rule && <p>No caution or warning now.</p>}
      </div>
      <div className="layout">
        <div className="stack">
          {chart}
          {rule && (
            <Card title="Explanation">
              <dl className="status-explanation">
                {(
                  [
                    ['What', rule.what],
                    ['Why it matters', rule.why],
                    ['How decided', rule.howDecided],
                  ] as const
                ).map(([term, text]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{text}</dd>
                  </div>
                ))}
                <div>
                  <dt>Source</dt>
                  <dd>
                    {rule.source} <span className="tag tag--rule">{`rule · ${rule.id}`}</span>
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
        {rule && (
          <div className="stack">
            <Card title="What next">
              <p className="detail-next">{rule.next}</p>
            </Card>
            <Card title="Who to involve">
              <ol className="tiers">
                {TIERS.map((tier) => (
                  <li key={tier} aria-current={tier === rule.tier ? 'true' : undefined}>
                    {tier}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}

export function SystemDetail({ system, onUnknown }: { system: string; onUnknown: () => void }) {
  const state = useSystemDetail(system)
  const heading = useRef<HTMLHeadingElement>(null)
  const focused = useRef(false)
  const detail = state.kind === 'ready' ? state.data : undefined

  useEffect(() => {
    if (state.kind === 'ready' && !state.data) onUnknown()
  }, [state, onUnknown])

  // Focus the heading once per opened system, so a re-read never steals focus.
  useEffect(() => {
    if (detail && !focused.current) {
      heading.current?.focus()
      focused.current = true
    }
  }, [detail])

  return (
    <section className="detail stack" aria-label={`${system} detail`}>
      <a href="#/" className="detail-back">
        ← Body systems
      </a>
      {state.kind === 'unavailable' && <p className="status-unavailable">Detail unavailable</p>}
      {state.kind === 'ready' && detail && <DetailBody detail={detail} now={state.now} headingRef={heading} />}
    </section>
  )
}
