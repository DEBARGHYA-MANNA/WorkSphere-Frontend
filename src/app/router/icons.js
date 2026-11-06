import {
  Bell,
  CircleCheckBig,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  Palette,
  UserRound,
  Building2,
} from 'lucide-react'

/**
 * Explicit icon registry.
 *
 * Navigation metadata references icons by name so it stays plain data (usable by
 * tests and non-React modules) while tree-shaking still works.
 */
export const NAV_ICONS = {
  LayoutDashboard,
  CircleCheckBig,
  FolderKanban,
  Users,
  Bell,
  Settings,
  Palette,
  UserRound,
  Building2,
}

/** Resolve a registered icon, falling back to a neutral glyph. */
export function getNavIcon(name) {
  return NAV_ICONS[name] ?? LayoutDashboard
}
