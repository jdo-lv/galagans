/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const CSS = {
  tokens: read('./tokens.css'),
  base: read('./base.css'),
  detail: read('../detail.css'),
  status: read('../status.css'),
  device: read('../../device/device.css'),
}

/** Every declaration of the rules whose selector list contains `selector`, later ones winning. */
function declarations(css: string, selector: string): Record<string, string> {
  const found: Record<string, string> = {}
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, selectors, body] of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((s) => s.trim().replace(/\s+/g, ' ') === selector)) continue
    for (const line of body.split(';')) {
      const colon = line.indexOf(':')
      if (colon > 0) found[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
    }
  }
  return found
}

const hasRule = (css: string, selector: string) => Object.keys(declarations(css, selector)).length > 0

describe('level tokens and neutral UI (#33)', () => {
  it('reads every stylesheet', () => {
    Object.values(CSS).forEach((css) => expect(css).not.toBe(''))
  })

  it('AC7: tokens.css defines the level, focus and to-do tokens and drops the old ones', () => {
    expect(declarations(CSS.tokens, ':root')).toMatchObject({
      '--color-check': 'var(--palette-caution-yellow)',
      '--color-on-check': 'var(--palette-ink)',
      '--color-alert': 'light-dark(var(--palette-red), var(--palette-bright-red))',
      '--color-on-alert': 'var(--palette-white)',
      '--color-focus': 'var(--color-text)',
      '--focus-ring': '2px solid var(--color-focus)',
      '--color-todo': 'light-dark(var(--palette-blue), var(--palette-blue-tint))',
    })
    for (const token of [
      '--color-caution',
      '--color-on-caution',
      '--color-warning',
      '--color-on-warning',
      '--color-accent',
      '--color-link-on-surface',
      '--color-link-hover',
      '--palette-deep-blue',
    ]) {
      expect(CSS.tokens).not.toContain(`${token}:`)
    }
  })

  it('AC8: level badges in base.css', () => {
    expect(declarations(CSS.base, '.badge--watch')).toEqual({
      color: 'var(--color-text)',
      'box-shadow': 'inset 0 0 0 1.5px var(--color-text)',
    })
    expect(declarations(CSS.base, '.badge--check')).toMatchObject({ background: 'var(--color-check)', color: 'var(--color-on-check)' })
    for (const level of ['treat', 'emergency']) {
      expect(declarations(CSS.base, `.badge--${level}`)).toMatchObject({ background: 'var(--color-alert)', color: 'var(--color-on-alert)' })
    }
    for (const level of ['check', 'treat', 'emergency']) {
      expect(declarations(CSS.base, `.badge--${level}`)['box-shadow']).toBe('inset 0 0 0 1.5px var(--color-text)')
    }
  })

  it('AC9: chart points take the level colour, markers stay in the text colour', () => {
    expect(declarations(CSS.detail, '.chart-point--watch').fill).toBe('var(--color-inset)')
    expect(declarations(CSS.detail, '.chart-point--check').fill).toBe('var(--color-check)')
    for (const level of ['treat', 'emergency']) expect(declarations(CSS.detail, `.chart-point--${level}`).fill).toBe('var(--color-alert)')
    for (const level of ['check', 'treat', 'emergency']) {
      expect(declarations(CSS.detail, `.chart-point--${level}`)).toMatchObject({ stroke: 'var(--color-text)', 'stroke-width': '1.5' })
    }
    const marker = declarations(CSS.detail, '.chart-marker')
    expect(marker.color).toBe('var(--color-text)')
    expect(Object.keys(marker)).not.toEqual(expect.arrayContaining(['fill']))
    expect(Object.keys(marker)).not.toEqual(expect.arrayContaining(['font-size']))
    expect(Object.keys(marker)).not.toEqual(expect.arrayContaining(['font-weight']))
  })

  it('AC10: links are neutral; the surface link rules and the due pill are gone', () => {
    expect(declarations(CSS.base, 'a')).toEqual({ color: 'var(--color-text)', 'text-decoration': 'underline', 'text-underline-offset': '0.15em' })
    expect(declarations(CSS.base, 'a:hover')).toEqual({ color: 'var(--color-text)' })
    expect(hasRule(CSS.base, '.card a')).toBe(false)
    expect(hasRule(CSS.status, '.card a.status-link')).toBe(false)
    expect(CSS.base).not.toContain('pill--due')
  })

  it('AC11: the due routine row is outlined in the level 1 to-do colour', () => {
    expect(declarations(CSS.base, '.routine-list > .routine-item--due').border).toBe('1px solid var(--color-todo)')
    expect(CSS.base).toMatch(
      /\/\* The outline replaces the divider; level 1 "to do" \(alert-levels\.md\), never red or yellow \*\/\s*\.routine-list > \.routine-item--due \{/,
    )
  })

  it('AC12: the dot display colours are the level tokens', () => {
    expect(declarations(CSS.device, '.dot--blue').fill).toBe('var(--color-todo)')
    expect(declarations(CSS.device, '.dot--yellow').fill).toBe('var(--color-check)')
    expect(declarations(CSS.device, '.dot--red').fill).toBe('var(--color-alert)')
  })
})
