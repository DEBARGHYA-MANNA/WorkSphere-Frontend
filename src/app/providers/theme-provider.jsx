import { useTheme } from '@/hooks/use-theme'

/**
 * Applies the persisted theme and keeps it in sync with the OS preference.
 * Renders nothing — it exists so theme side effects run once at the app root.
 */
export function ThemeProvider({ children }) {
  useTheme()
  return children
}
