import { Component } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

/**
 * Catches render-time errors so a single broken view never blanks the app.
 * Shows a recovery action and (in development only) the error message.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Unhandled render error', error?.message, errorInfo?.componentStack)
  }

  handleReset() {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6" role="alert">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive-muted">
            <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This section failed to render. You can retry, or reload the page if the problem
            continues.
          </p>
          {env.isDev && error?.message ? (
            <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-surface-muted p-3 text-left text-xs text-muted-foreground">
              {error.message}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={this.handleReset}>
              <RotateCw />
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
