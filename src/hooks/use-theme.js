import { useCallback, useEffect } from 'react'
import { useUiStore, resolveTheme, applyTheme } from '@/stores/ui-store'

/**
 * Theme controller.
 *
 * - Applies the persisted preference on mount and whenever it changes.
 * - Follows the OS preference live while the mode is `system`.
 * - Persists through the Zustand `persist` middleware (localStorage).
 */
export function useTheme() {
  const theme = useUiStore((state) => state.theme)
  const setThemePreference = useUiStore((state) => state.setTheme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return undefined

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next) => setThemePreference(next), [setThemePreference])
  const toggleTheme = useCallback(() => {
    setTheme(resolveTheme(theme) === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return {
    theme,
    resolvedTheme: resolveTheme(theme),
    setTheme,
    toggleTheme,
  }
}
