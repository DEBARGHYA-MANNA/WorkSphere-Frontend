import { lazy } from 'react'

/**
 * Route-level code splitting.
 *
 * Every page is its own chunk so the shell (layout + primitives) stays small and
 * heavy views (charts, kanban) only load when visited.
 */
export const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'))
export const MyTasksPage = lazy(() => import('@/features/tasks/pages/my-tasks-page'))
export const ProjectsPage = lazy(() => import('@/features/projects/pages/projects-page'))
export const MembersPage = lazy(() => import('@/features/members/pages/members-page'))
export const NotificationsPage = lazy(
  () => import('@/features/notifications/pages/notifications-page'),
)
export const SettingsPage = lazy(() => import('@/features/settings/pages/settings-page'))
export const NotFoundPage = lazy(() => import('@/features/errors/pages/not-found-page'))

// Authentication (Phase 3)
export const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
export const RegisterPage = lazy(() => import('@/features/auth/pages/register-page'))
export const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/forgot-password-page'))
export const ResetPasswordPage = lazy(() => import('@/features/auth/pages/reset-password-page'))
