import { describe, expect, it } from 'vitest'
import { unwrap } from '@/services/http/envelope'
import { withId } from '@/services/organization-service'

describe('withId', () => {
  it('adds id from _id and keeps the raw document intact', () => {
    const raw = { _id: '65f1c0ffee000000000000aa', name: 'Acme' }
    expect(withId(raw)).toEqual({ ...raw, id: '65f1c0ffee000000000000aa' })
  })

  it('does not overwrite an existing id', () => {
    expect(withId({ _id: 'a', id: 'b' }).id).toBe('b')
  })

  it('passes through null, undefined, and primitives', () => {
    expect(withId(null)).toBeNull()
    expect(withId(undefined)).toBeUndefined()
    expect(withId('x')).toBe('x')
  })

  it('is a no-op object-wise for records without _id', () => {
    expect(withId({ name: 'No id' })).toEqual({ name: 'No id', id: undefined })
  })
})

describe('unwrap', () => {
  it('accepts either a bare payload or a { data } envelope', () => {
    expect(unwrap({ id: '1' })).toEqual({ id: '1' })
    expect(unwrap({ success: true, data: { id: '2' } })).toEqual({ id: '2' })
  })
})
