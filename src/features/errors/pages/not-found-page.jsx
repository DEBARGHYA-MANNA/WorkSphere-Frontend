import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-surface-muted">
        <Compass className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Button asChild className="mt-6">
        <Link to={ROUTES.dashboard}>Back to dashboard</Link>
      </Button>
    </div>
  )
}
