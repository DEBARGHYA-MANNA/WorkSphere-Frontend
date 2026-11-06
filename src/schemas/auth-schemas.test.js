import { describe, expect, it } from 'vitest'
import {
  byteLength,
  forgotPasswordSchema,
  loginSchema,
  passwordStrength,
  registerSchema,
  resetPasswordSchema,
} from '@/schemas/auth-schemas'

describe('byteLength', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(byteLength('abc')).toBe(3)
    // Multi-byte characters must count for their encoded size (bcrypt's limit).
    expect(byteLength('é')).toBe(2)
    expect(byteLength('🔐')).toBe(4)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'correct horse battery',
    confirmPassword: 'correct horse battery',
  }

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('requires a name of at least 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toBe('Name must be at least 2 characters')
  })

  it('trims the name before validating length', () => {
    expect(registerSchema.safeParse({ ...valid, name: '  A  ' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, name: '  Ada  ' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toBe('Enter a valid email address')
  })

  it('enforces the 12-character minimum password', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    expect(result.error.issues.some((i) => i.message.includes('at least 12'))).toBe(true)
  })

  it('rejects a password over 72 bytes even when under 72 characters', () => {
    // 20 emoji = 80 bytes but only 40 UTF-16 code units.
    const emojiPassword = '🔐'.repeat(20)
    expect(emojiPassword.length).toBeLessThan(72)
    const result = registerSchema.safeParse({
      ...valid,
      password: emojiPassword,
      confirmPassword: emojiPassword,
    })
    expect(result.success).toBe(false)
    expect(result.error.issues.some((i) => i.message.includes('72 bytes'))).toBe(true)
  })

  it('requires matching passwords and points the error at confirmPassword', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different passphrase' })
    expect(result.success).toBe(false)
    const issue = result.error.issues.find((i) => i.message === 'Passwords do not match')
    expect(issue.path).toEqual(['confirmPassword'])
  })
})

describe('loginSchema', () => {
  it('accepts any non-empty password (no length policy on sign-in)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
  })

  it('requires an email and a password', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(2)
  })

  it('rejects a password beyond the bcrypt byte limit', () => {
    const result = loginSchema.safeParse({ email: 'a@b.co', password: '🔐'.repeat(20) })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('requires a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'ada@example.com' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const token = 'a'.repeat(40)

  it('accepts a well-formed token and strong enough password', () => {
    const result = resetPasswordSchema.safeParse({
      token,
      password: 'correct horse battery',
      confirmPassword: 'correct horse battery',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a token shorter than 32 characters', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'short',
      password: 'correct horse battery',
      confirmPassword: 'correct horse battery',
    })
    expect(result.success).toBe(false)
    expect(result.error.issues.some((i) => i.message.includes('incomplete'))).toBe(true)
  })

  it('rejects tokens with characters outside the allowed set', () => {
    const result = resetPasswordSchema.safeParse({
      token: `${'a'.repeat(35)}!!`,
      password: 'correct horse battery',
      confirmPassword: 'correct horse battery',
    })
    expect(result.success).toBe(false)
    expect(result.error.issues.some((i) => i.message.includes('invalid characters'))).toBe(true)
  })
})

describe('passwordStrength', () => {
  it('reports empty input distinctly', () => {
    expect(passwordStrength('').label).toBe('Empty')
  })

  it('scores length and variety', () => {
    expect(passwordStrength('short').score).toBe(0)
    expect(passwordStrength('twelve chars').score).toBe(1)
    expect(passwordStrength('TwelveCharsHere!').score).toBeGreaterThanOrEqual(3)
  })

  it('never exceeds the label list', () => {
    expect(passwordStrength('aVeryLongPassphrase123!').score).toBeLessThanOrEqual(4)
  })
})
