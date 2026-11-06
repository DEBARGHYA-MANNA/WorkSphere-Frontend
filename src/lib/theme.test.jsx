import { describe, expect, it, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUiStore, resolveTheme, THEME_MODES } from '@/stores/ui-store'
import { useTheme } from '@/hooks/use-theme'

function resetStore() {
  act(() => {
    useUiStore.setState({
      sidebarCollapsed: false,
      theme: THEME_MODES.system,
      activeOrganizationId: null,
      mobileNavOpen: false,
      compactList: false,
    })
  })
}

describe('resolveTheme', () => {
  it('returns explicit modes unchanged', () => {
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
  })

  it('falls back to light when the OS has no dark preference', () => {
    expect(resolveTheme('system')).toBe('light')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    resetStore()
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })
  })

  it('defaults to the system preference', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('applies and persists a theme change to the document element', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('dark'))

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.setTheme('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles between light and dark from the resolved theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('ignores unknown theme values', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('neon'))
    expect(result.current.theme).toBe('system')
  })
})
