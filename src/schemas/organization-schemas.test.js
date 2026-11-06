import { describe, expect, it } from 'vitest'
import {
  createOrganizationDefaults,
  createOrganizationSchema,
  inviteMemberDefaults,
  inviteMemberSchema,
  updateOrganizationSchema,
} from '@/schemas/organization-schemas'

/** Collect messages keyed by field path, for terse assertions. */
function errorsOf(result) {
  const out = {}
  for (const issue of result.error?.issues ?? []) {
    const path = issue.path.join('.')
    if (!out[path]) out[path] = issue.message
  }
  return out
}

describe('createOrganizationSchema', () => {
  it('accepts a minimal organization and trims the name', () => {
    const parsed = createOrganizationSchema.safeParse({ name: '  Acme Corp  ' })
    expect(parsed.success).toBe(true)
    expect(parsed.data.name).toBe('Acme Corp')
  })

  it('rejects names shorter than 2 characters or longer than 120', () => {
    expect(errorsOf(createOrganizationSchema.safeParse({ name: 'A' })).name).toMatch(/at least 2/)
    expect(errorsOf(createOrganizationSchema.safeParse({ name: 'x'.repeat(121) })).name).toMatch(
      /120/,
    )
  })

  it('rejects a name that cannot produce a slug', () => {
    expect(errorsOf(createOrganizationSchema.safeParse({ name: '!!!' })).name).toMatch(
      /letters or numbers/,
    )
  })

  it('allows an empty description but caps it at 2000 characters', () => {
    expect(createOrganizationSchema.safeParse({ name: 'Acme', description: '' }).success).toBe(true)
    expect(
      errorsOf(createOrganizationSchema.safeParse({ name: 'Acme', description: 'x'.repeat(2001) }))
        .description,
    ).toMatch(/2000/)
  })

  it('only allows Member or Viewer as the default member role', () => {
    const ok = createOrganizationSchema.safeParse({
      name: 'Acme',
      settings: { allowMemberInvites: false, defaultMemberRole: 'Viewer' },
    })
    expect(ok.success).toBe(true)

    const bad = createOrganizationSchema.safeParse({
      name: 'Acme',
      settings: { allowMemberInvites: true, defaultMemberRole: 'Owner' },
    })
    expect(bad.success).toBe(false)
  })

  it('ships defaults the dialog can reset to', () => {
    expect(createOrganizationSchema.safeParse(createOrganizationDefaults).success).toBe(false)
    expect(createOrganizationDefaults.settings.defaultMemberRole).toBe('Member')
  })
})

describe('updateOrganizationSchema', () => {
  it('requires at least one changed field, like the backend min(1)', () => {
    expect(updateOrganizationSchema.safeParse({}).success).toBe(false)
    expect(updateOrganizationSchema.safeParse({ name: 'Acme' }).success).toBe(true)
    expect(
      updateOrganizationSchema.safeParse({ settings: { allowMemberInvites: false } }).success,
    ).toBe(true)
  })

  it('re-validates the name when present', () => {
    expect(errorsOf(updateOrganizationSchema.safeParse({ name: 'A' })).name).toMatch(/at least 2/)
  })

  it('accepts a partial settings patch', () => {
    const parsed = updateOrganizationSchema.safeParse({ settings: { defaultMemberRole: 'Viewer' } })
    expect(parsed.success).toBe(true)
  })
})

describe('inviteMemberSchema', () => {
  it('requires a syntactically valid email', () => {
    expect(errorsOf(inviteMemberSchema.safeParse({ email: '' })).email).toMatch(/required/i)
    expect(errorsOf(inviteMemberSchema.safeParse({ email: 'not-an-email' })).email).toMatch(
      /valid email/,
    )
    expect(inviteMemberSchema.safeParse({ email: 'ada@example.com' }).success).toBe(true)
  })

  it('rejects an over-long email, matching the backend 254 limit', () => {
    const long = `${'a'.repeat(250)}@example.com`
    expect(errorsOf(inviteMemberSchema.safeParse({ email: long })).email).toMatch(/254/)
  })

  it('never allows inviting someone as Owner', () => {
    expect(inviteMemberSchema.safeParse({ email: 'ada@example.com', role: 'Owner' }).success).toBe(
      false,
    )
  })

  it('accepts every assignable role', () => {
    for (const role of ['Admin', 'Manager', 'Member', 'Viewer']) {
      expect(inviteMemberSchema.safeParse({ email: 'ada@example.com', role }).success).toBe(true)
    }
  })

  it('defaults to the Member role', () => {
    expect(inviteMemberDefaults.role).toBe('Member')
    expect(inviteMemberSchema.safeParse(inviteMemberDefaults).success).toBe(false)
  })
})
