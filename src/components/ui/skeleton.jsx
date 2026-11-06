import { cn } from '@/lib/utils'

/**
 * Shimmering placeholder block used while data loads.
 * `aria-hidden` by default: the surrounding region should carry the status text.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
    </div>
  )
}
