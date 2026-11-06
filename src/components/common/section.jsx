import { cn } from '@/lib/utils'

/** A titled block inside a page — keeps vertical rhythm consistent. */
export function Section({ title, description, actions, children, className, contentClassName }) {
  return (
    <section className={cn('space-y-4', className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            {title ? <h2 className="text-sm font-semibold tracking-tight">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}
