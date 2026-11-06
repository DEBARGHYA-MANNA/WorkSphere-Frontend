/**
 * Application-wide constants that are not secrets and not server data.
 */

export const APP_NAME = 'WorkSphere'
export const APP_TAGLINE = 'One workspace. Every project. Better collaboration.'

/** Storage keys — prefixed so they never collide with other apps on the origin. */
export const STORAGE_KEYS = Object.freeze({
  ui: 'worksphere-ui',
  authHint: 'worksphere-auth-hint',
})

/**
 * Route paths. Centralised so links, redirects and tests never drift.
 */
export const ROUTES = Object.freeze({
  root: '/',

  // Public
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  acceptInvitation: '/accept-invitation',

  // Protected
  dashboard: '/dashboard',
  myTasks: '/my-tasks',
  projects: '/projects',
  projectDetails: '/projects/:projectId',
  projectTasks: '/projects/:projectId/tasks',
  tasks: '/tasks',
  taskDetails: '/tasks/:taskId',
  members: '/members',
  notifications: '/notifications',
  analytics: '/analytics',
  settings: '/settings',
  organizationSettings: '/settings/organization',
  profileSettings: '/settings/profile',
  appearanceSettings: '/settings/appearance',

  // Fallbacks
  notFound: '/404',
  forbidden: '/403',
})

/**
 * Query keys root namespace. Feature-level keys extend these so invalidation
 * can be scoped (e.g. invalidate everything under `['tasks']`).
 */
export const QUERY_KEYS = Object.freeze({
  auth: 'auth',
  organizations: 'organizations',
  members: 'members',
  invitations: 'invitations',
  projects: 'projects',
  tasks: 'tasks',
  comments: 'comments',
  notifications: 'notifications',
  activity: 'activity',
  analytics: 'analytics',
})

/** Pagination defaults used by list views. */
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Debounce delay for search inputs, in ms. */
export const SEARCH_DEBOUNCE_MS = 350
