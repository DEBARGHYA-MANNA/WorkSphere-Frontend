import { ROUTES } from '@/lib/constants'

/**
 * Single source of truth for navigation metadata.
 * Icons are referenced by name so this module stays free of React imports and
 * can be used by tests and non-component code.
 */
export const PRIMARY_NAV = [
  { key: 'dashboard', to: ROUTES.dashboard, label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'my-tasks', to: ROUTES.myTasks, label: 'My Tasks', icon: 'CircleCheckBig' },
  { key: 'projects', to: ROUTES.projects, label: 'Projects', icon: 'FolderKanban' },
  { key: 'members', to: ROUTES.members, label: 'Team Members', icon: 'Users' },
  { key: 'notifications', to: ROUTES.notifications, label: 'Notifications', icon: 'Bell' },
  { key: 'settings', to: ROUTES.settings, label: 'Settings', icon: 'Settings' },
]

export const SETTINGS_NAV = [
  { key: 'settings-profile', to: ROUTES.profileSettings, label: 'Profile' },
  { key: 'settings-org', to: ROUTES.organizationSettings, label: 'Organization' },
  { key: 'settings-appearance', to: ROUTES.appearanceSettings, label: 'Appearance' },
]

export const PUBLIC_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]
