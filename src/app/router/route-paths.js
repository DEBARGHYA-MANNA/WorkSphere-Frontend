import { ROUTES } from '@/lib/constants'

/** Primary sidebar navigation, in display order. */
export const PRIMARY_NAV = [
  { key: 'dashboard', to: ROUTES.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'organizations', to: ROUTES.organizations, label: 'Organizations', icon: 'Building2' },
  { key: 'my-tasks', to: ROUTES.myTasks, label: 'My Tasks', icon: 'CircleCheckBig' },
  { key: 'projects', to: ROUTES.projects, label: 'Projects', icon: 'FolderKanban' },
  { key: 'members', to: ROUTES.members, label: 'Team Members', icon: 'Users' },
  { key: 'notifications', to: ROUTES.notifications, label: 'Notifications', icon: 'Bell' },
  { key: 'settings', to: ROUTES.settings, label: 'Settings', icon: 'Settings' },
]

/** Settings sub-navigation (Phase 12 renders the sections). */
export const SETTINGS_NAV = [
  { key: 'profile', to: ROUTES.profileSettings, label: 'Profile', icon: 'UserRound' },
  {
    key: 'organization',
    to: ROUTES.organizationSettings,
    label: 'Organization',
    icon: 'Building2',
  },
  { key: 'appearance', to: ROUTES.appearanceSettings, label: 'Appearance', icon: 'Palette' },
]

export const PUBLIC_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]

/**
 * Is `pathname` inside the section identified by `to`?
 * `/projects/123` belongs to `/projects`; `/projects-archive` does not.
 */
export function isRouteActive(pathname, to) {
  if (!pathname || !to) return false
  if (to === ROUTES.dashboard) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}
