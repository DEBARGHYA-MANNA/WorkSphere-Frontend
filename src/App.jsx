import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { SessionProvider } from '@/app/providers/session-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { createAppRouter } from '@/app/router'

const router = createAppRouter()

/**
 * Application root.
 *
 * Provider order matters:
 *   ThemeProvider   – applies tokens before anything paints
 *   QueryProvider   – server-state cache for every feature
 *   SessionProvider – HTTP interceptors + session bootstrap (needs the cache to
 *                     clear it when a session ends)
 *   RouterProvider  – route-level code splitting, public/protected guards
 *   Toaster         – global feedback surface
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <SessionProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
            <Toaster />
          </SessionProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
