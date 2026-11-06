import { ROUTES } from '@/lib/constants'

/**
 * Human labels for static path segments.
 * Dynamic ids are resolved by the caller (which owns the entity), never guessed
 * here — an unknown id falls back to a neutral label.
 */
const SEGMENT_LABELS = {
  dashboard: 'Dashboard',
  'my-tasks': 'My Tasks',
  projects: 'Projects',
  tasks: 'Tasks',
  members: 'Team Members',
  notifications: 'Notifications',
  settings: 'Settings',
  analytics: 'Analytics',
  profile: 'Profile',
  organization: 'Organization',
  appearance: 'Appearance',
}

const ID_SEGMENT = /^[a-fA-F0-9]{24}$|^\d+$/

/**
 * Build breadcrumb items from a pathname.
 *
 * @param {string} pathname
 * @param {Record<string, string>} [labels] map of raw segment → display label
 *        (e.g. a project name resolved by the page)
 * @returns {Array<{ label: string, to: string, isCurrent: boolean }>}
 */
export function buildBreadcrumbs(pathname = '/', labels = {}) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const items = []
  let accumulated = ''

  segments.forEach((segment, index) => {
    accumulated += `/${segment}`
    const isCurrent = index === segments.length - 1

    let label = labels[segment]
    if (!label) {
      if (ID_SEGMENT.test(segment)) {
        // A raw id must not leak into the UI; the caller supplies a real label.
        label = 'Details'
      } else {
        label = SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ')
      }
    }

    items.push({
      label,
      to: accumulated,
      isCurrent,
    })
  })

  return items
}

/** Sections that should never render a breadcrumb trail (they are roots). */
export const BREADCRUMB_ROOTS = new Set([ROUTES.dashboard, ROUTES.myTasks, ROUTES.projects])
