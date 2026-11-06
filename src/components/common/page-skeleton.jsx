import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Re-exported for convenience so callers can import the whole skeleton family
// from one place.
export { Skeleton }

/**
 * Route-level suspense fallback: reserves the shape of a page so navigation
 * never flashes a blank screen.
 */
export function PageSkeleton({ className }) {
  return (
    <div
      className={cn('animate-fade-in space-y-6 p-6 lg:p-8', className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading page…</span>
      <div className="space-y-3">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-4 h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
