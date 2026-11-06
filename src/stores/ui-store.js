import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'

/**
 * Client/UI state only.
 *
 * Server data (organizations, projects, tasks, notifications…) belongs to
 * TanStack Query, never to Zustand. Everything here is a local preference.
 */
export const THEME_MODES = Object.freeze({
  light: 'light',
  dark: 'dark',
  system: 'system',
})

/** Resolve `system` against the OS preference. */
export function resolveTheme(theme) {
  if (theme === THEME_MODES.dark) return 'dark'
  if (theme === THEME_MODES.light) return 'light'
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply the resolved theme to <html>. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export const useUiStore = create(
  persist(
    (set) => ({
      // Sidebar collapsed state (desktop rail). Mobile drawer state is ephemeral.
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: Boolean(collapsed) }),

      // Theme preference: 'light' | 'dark' | 'system'
      theme: THEME_MODES.system,
      setTheme: (theme) => set({ theme: THEME_MODES[theme] ? theme : THEME_MODES.system }),

      // The organization the user last selected. This is a *hint* used to pick a
      // sensible default; the backend still validates membership on every call.
      activeOrganizationId: null,
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id ?? null }),

      // Mobile navigation drawer.
      mobileNavOpen: false,
      setMobileNavOpen: (open) => set({ mobileNavOpen: Boolean(open) }),

      // Preferred density of list views (purely visual).
      compactList: false,
      setCompactList: (compact) => set({ compactList: Boolean(compact) }),
    }),
    {
      name: STORAGE_KEYS.ui,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Only preferences persist — never transient UI state.
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        activeOrganizationId: state.activeOrganizationId,
        compactList: state.compactList,
      }),
    },
  ),
)
