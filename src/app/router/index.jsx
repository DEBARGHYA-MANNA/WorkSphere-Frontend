import { Outlet, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/app/layouts/app-shell'
import { ROUTES } from '@/lib/constants'
import {
  DashboardPage,
  MyTasksPage,
  ProjectsPage,
  MembersPage,
  NotificationsPage,
  SettingsPage,
  NotFoundPage,
} from '@/app/router/lazy-pages'
import { RouteErrorPage } from '@/components/common/route-error-page'
import { RootRedirect } from '@/app/router/root-redirect'

/**
 * Router configuration.
 *
 * Public routes are wrapped in their own layout; protected routes sit under
 * `AppShell`. Authentication guards are introduced in Phase 3 — until then the
 * shell renders so the layout can be reviewed.
 */
export const routes = [
  {
    // Public layout — authentication screens are added in Phase 3.
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [],
  },
  {
    path: ROUTES.root,
    element: <RootRedirect />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.myTasks, element: <MyTasksPage /> },
      { path: ROUTES.projects, element: <ProjectsPage /> },
      { path: ROUTES.members, element: <MembersPage /> },
      { path: ROUTES.notifications, element: <NotificationsPage /> },
      { path: ROUTES.settings, element: <SettingsPage /> },
      { path: ROUTES.settings + '/:section', element: <SettingsPage /> },
      { path: ROUTES.notFound, element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
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
