import { describe, expect, it } from 'vitest'
import { cn, initialsOf, percentage, formatNumber, titleFromSlug, get, clamp } from '@/lib/utils'

describe('cn', () => {
  it('merges conditional classes', () => {
    const isHidden = false
    expect(cn('a', isHidden && 'b', undefined, 'c')).toBe('a c')
  })

  it('lets later Tailwind utilities win', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })
})

describe('percentage', () => {
  it('rounds to the nearest whole percent', () => {
    expect(percentage(1, 3)).toBe(33)
  })

  it('returns 0 for a zero or invalid total', () => {
    expect(percentage(5, 0)).toBe(0)
    expect(percentage(undefined, undefined)).toBe(0)
  })

  it('clamps results into 0–100', () => {
    expect(percentage(15, 10)).toBe(100)
    expect(percentage(-4, 10)).toBe(0)
  })
})

describe('initialsOf', () => {
  it('uses first and last word initials', () => {
    expect(initialsOf('Ada Lovelace Byron')).toBe('AB')
  })

  it('handles a single word', () => {
    expect(initialsOf('Ada')).toBe('AD')
  })

  it('derives initials from an email local part', () => {
    expect(initialsOf('ada.lovelace@example.com')).toBe('AL')
  })

  it('never throws on empty input', () => {
    expect(initialsOf('')).toBe('?')
    expect(initialsOf(undefined)).toBe('?')
  })
})

describe('formatNumber', () => {
  it('formats numbers', () => {
    expect(formatNumber(1234)).toMatch(/1.?234/)
  })

  it('returns a dash for missing values', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('titleFromSlug', () => {
  it('humanises slugs', () => {
    expect(titleFromSlug('my-tasks')).toBe('My Tasks')
    expect(titleFromSlug('project_settings')).toBe('Project Settings')
  })
})

describe('get', () => {
  it('reads nested paths with fallbacks', () => {
    const obj = { a: { b: { c: 1 } } }
    expect(get(obj, 'a.b.c')).toBe(1)
    expect(get(obj, 'a.b.z', 'fallback')).toBe('fallback')
    expect(get(null, 'a.b', 5)).toBe(5)
  })
})

describe('clamp', () => {
  it('bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(21, 0, 10)).toBe(10)
  })
})
