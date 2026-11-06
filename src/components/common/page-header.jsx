import { cn } from '@/lib/utils'

/**
 * Standard page header.
 *
 * Every page uses this so titles, descriptions, and actions share one rhythm:
 *   <PageHeader title="Projects" description="…" actions={<Button/>} />
 * Children render below the title row (filter bars, tabs, summaries).
 */
export function PageHeader({ title, description, actions, children, className, titleId }) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 id={titleId} className="truncate text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  )
}
