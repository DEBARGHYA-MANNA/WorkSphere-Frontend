import { z } from 'zod'

/**
 * Client-side validation mirrors the backend's Joi rules so users get instant,
 * specific feedback. The server remains authoritative — these schemas never
 * replace its checks, they only avoid a pointless round-trip for obvious errors.
 *
 * Backend rules (src/modules/auth/auth.validation.js):
 *   name      2–100 chars, trimmed
 *   email     valid email, trimmed, lowercased, max 254
 *   password  12–72 chars AND ≤ 72 UTF-8 *bytes* (bcrypt limit)
 *   token     32–256 chars, /^[A-Za-z0-9_-]+$/
 */

/** UTF-8 byte length — bcrypt truncates beyond 72 bytes, so the UI must too. */
export function byteLength(value = '') {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length
  return unescape(encodeURIComponent(value)).length
}

/** Pragmatic email check: one @, a dot in the domain, no whitespace. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must be 254 characters or fewer')
  // `refine` (not `.email()`) so an empty field reports one clear message
  // instead of "required" and "invalid" at the same time.
  .refine((value) => value === '' || EMAIL_PATTERN.test(value), 'Enter a valid email address')

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(12, 'Password must be at least 12 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .refine((value) => byteLength(value) <= 72, 'Password must be 72 bytes or fewer')

const newPasswordField = passwordField

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be 100 characters or fewer'),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string({ required_error: 'Confirm your password' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const loginSchema = z.object({
  email: emailField,
  // Login does not enforce the length policy: an existing password may predate
  // it, and telling the user "too short" leaks policy for a wrong guess.
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .refine((value) => byteLength(value) <= 72, 'Password must be 72 bytes or fewer'),
})

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ required_error: 'Reset token is required' })
      .trim()
      .min(32, 'Reset token looks incomplete')
      .max(256, 'Reset token is too long')
      .regex(/^[A-Za-z0-9_-]+$/, 'Reset token contains invalid characters'),
    password: newPasswordField,
    confirmPassword: z.string({ required_error: 'Confirm your password' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

/**
 * Password strength signal for the register/reset forms.
 * Returns a 0–4 score plus a short label. This is guidance only — the backend
 * enforces the real rule (length ≥ 12).
 */
export function passwordStrength(password = '') {
  if (!password) return { score: 0, label: 'Empty' }
  let score = 0
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[Math.min(score, 4)] }
}
