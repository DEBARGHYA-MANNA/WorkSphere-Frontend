import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertOctagon, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Router-level error boundary for loader/render failures and bad URLs.
 * Keeps the user inside the app instead of showing a blank screen.
 */
export function RouteErrorPage() {
  const error = useRouteError()

  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const title = isNotFound ? 'Page not found' : 'This page could not be loaded'
  const description = isNotFound
    ? 'The address may be mistyped, or the page no longer exists.'
    : 'An unexpected error interrupted this view. Retrying usually resolves it.'

  if (!isRouteErrorResponse(error)) {
    logger.error('Route error', error?.message)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6" role="alert">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive-muted">
          <AlertOctagon className="size-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {env.isDev && error?.message ? (
          <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-surface-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => window.location.reload()}>
            <RotateCw />
            Reload
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.dashboard}>Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
