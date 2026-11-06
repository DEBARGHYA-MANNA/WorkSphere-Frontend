import { Construction } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Honest placeholder for routes whose feature is delivered in a later phase.
 * It never pretends data is present — it states exactly what will land here and
 * which phase brings it, so the shell can be reviewed without mock screens.
 */
export function PlaceholderPage({ title, description, phase, items = [] }) {
  return (
    <div className="animate-fade-in">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {phase ? (
            <Badge variant="outline" className="gap-1 text-xs font-medium">
              <Construction className="size-3" aria-hidden="true" />
              Phase {phase}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-surface-muted/40 p-8">
        <h2 className="text-sm font-semibold">Not implemented yet</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This route is part of the application shell so navigation, layout, and accessibility can
          be reviewed end to end. The interface below arrives in its own phase.
        </p>
        {items.length > 0 ? (
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
