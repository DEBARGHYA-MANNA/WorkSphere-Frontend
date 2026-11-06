import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/app/layouts/app-shell'
import { PublicLayout } from '@/app/layouts/public-layout'
import { ROUTES } from '@/lib/constants'
import {
  DashboardPage,
  MyTasksPage,
  ProjectsPage,
  MembersPage,
  NotificationsPage,
  SettingsPage,
  NotFoundPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  OrganizationsPage,
  OrganizationSettingsPage,
  AcceptInvitationPage,
} from '@/app/router/lazy-pages'
import { RouteErrorPage } from '@/components/common/route-error-page'
import { RootRedirect } from '@/app/router/root-redirect'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/components/protected-route'

/**
 * Router configuration.
 *
 * Route classes
 *  - Public-only (`PublicOnlyRoute`): auth screens; a signed-in visitor is
 *    forwarded to their intended destination instead of seeing a login form.
 *  - Protected (`ProtectedRoute`): everything behind the app shell. While the
 *    refresh cookie is being checked the guard renders a status region rather
 *    than redirecting, which is what prevents redirect loops on reload.
 *  - Fallback: `*` renders the 404 page inside the shell when authenticated.
 */
export const routes = [
  {
    element: <PublicOnlyRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
          { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    path: ROUTES.root,
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.myTasks, element: <MyTasksPage /> },
          { path: ROUTES.projects, element: <ProjectsPage /> },
          { path: ROUTES.organizations, element: <OrganizationsPage /> },
          { path: ROUTES.organizationSettings, element: <OrganizationSettingsPage /> },
          // Accepting requires an authenticated session matching the invite email.
          { path: ROUTES.acceptInvitation, element: <AcceptInvitationPage /> },
          { path: ROUTES.members, element: <MembersPage /> },
          { path: ROUTES.notifications, element: <NotificationsPage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
          { path: `${ROUTES.settings}/:section`, element: <SettingsPage /> },
          { path: ROUTES.notFound, element: <NotFoundPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

/**
 * Opt into the v7 behaviours we already rely on, so the upgrade path is a
 * version bump rather than a behaviour change.
 */
const FUTURE_FLAGS = {
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_relativeSplatPath: true,
  v7_skipActionErrorRevalidation: true,
}

export function createAppRouter() {
  return createBrowserRouter(routes, { future: FUTURE_FLAGS })
}
