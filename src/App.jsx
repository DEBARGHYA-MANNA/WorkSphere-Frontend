import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { createAppRouter } from '@/app/router'

const router = createAppRouter()

/**
 * Application root.
 *
 * Provider order matters:
 *   ThemeProvider  – applies tokens before anything paints
 *   QueryProvider  – server-state cache for every feature
 *   RouterProvider – route-level code splitting inside the shell
 *   Toaster        – global feedback surface
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
