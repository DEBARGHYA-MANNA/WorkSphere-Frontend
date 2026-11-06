import { cn } from '@/lib/utils'

/**
 * Empty state: always explains *why* the area is empty and offers the next step.
 * The icon is decorative; the heading carries the meaning.
 */
export function EmptyState({ icon: Icon, title, description, action, className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full bg-surface shadow-xs ring-1 ring-border"
        >
          <Icon className="size-5 text-muted-foreground" />
        </span>
      ) : null}
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
