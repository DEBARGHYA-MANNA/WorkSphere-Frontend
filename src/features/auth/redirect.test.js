import { describe, expect, it } from 'vitest'
import { isAuthRoute, loginUrlWithRedirect, safeRedirect } from '@/features/auth/redirect'

describe('safeRedirect', () => {
  it('accepts internal paths', () => {
    expect(safeRedirect('/projects')).toBe('/projects')
    expect(safeRedirect('/projects/abc?tab=tasks')).toBe('/projects/abc?tab=tasks')
    expect(safeRedirect('/settings/profile#bio')).toBe('/settings/profile#bio')
  })

  it('falls back to the dashboard for missing values', () => {
    expect(safeRedirect(null)).toBe('/dashboard')
    expect(safeRedirect(undefined)).toBe('/dashboard')
    expect(safeRedirect('')).toBe('/dashboard')
    expect(safeRedirect('   ')).toBe('/dashboard')
  })

  it.each([
    ['https://evil.example/steal', 'absolute URL'],
    ['http://evil.example', 'http plain URL'],
    ['//evil.example/path', 'protocol-relative'],
    ['/\\evil.example', 'backslash protocol-relative'],
    ['javascript:alert(1)', 'javascript scheme'],
    ['data:text/html,<script>alert(1)</script>', 'data scheme'],
    ['/path with spaces', 'whitespace'],
    ['/path\n/../evil', 'control characters'],
  ])('rejects %s (%s)', (input) => {
    expect(safeRedirect(input)).toBe('/dashboard')
  })

  it('never returns a user to an auth screen', () => {
    expect(safeRedirect('/login')).toBe('/dashboard')
    expect(safeRedirect('/register')).toBe('/dashboard')
    expect(safeRedirect('/forgot-password')).toBe('/dashboard')
    expect(safeRedirect('/reset-password?token=x')).toBe('/dashboard')
  })

  it('honours a custom fallback', () => {
    expect(safeRedirect('https://evil.example', '/projects')).toBe('/projects')
  })

  it('normalises traversal attempts into a safe internal path', () => {
    const result = safeRedirect('/projects/../../admin')
    expect(result.startsWith('/')).toBe(true)
    expect(result).not.toContain('..')
    expect(result.startsWith('//')).toBe(false)
  })
})

describe('isAuthRoute', () => {
  it('recognises every public auth screen', () => {
    expect(isAuthRoute('/login')).toBe(true)
    expect(isAuthRoute('/register')).toBe(true)
    expect(isAuthRoute('/forgot-password')).toBe(true)
    expect(isAuthRoute('/reset-password')).toBe(true)
  })

  it('does not match app routes', () => {
    expect(isAuthRoute('/dashboard')).toBe(false)
    expect(isAuthRoute('/projects')).toBe(false)
    expect(isAuthRoute('/login-help')).toBe(false)
  })
})

describe('loginUrlWithRedirect', () => {
  it('encodes the intended destination', () => {
    expect(loginUrlWithRedirect('/projects/42?tab=tasks')).toBe(
      '/login?redirect=%2Fprojects%2F42%3Ftab%3Dtasks',
    )
  })

  it('omits the parameter for the default destination', () => {
    expect(loginUrlWithRedirect('/dashboard')).toBe('/login')
    expect(loginUrlWithRedirect(null)).toBe('/login')
  })

  it('drops unsafe destinations', () => {
    expect(loginUrlWithRedirect('https://evil.example')).toBe('/login')
  })
})
