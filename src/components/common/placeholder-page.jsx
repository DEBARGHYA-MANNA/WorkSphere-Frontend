import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Honest placeholder for routes whose feature is delivered in a later phase.
 *
 * It never pretends data is present: it states what will land here, which phase
 * brings it, and which backend capability it depends on. This lets the shell and
 * navigation be reviewed end to end without mock screens that look real.
 */
export function PlaceholderPage({ title, description, phase, items = [], dependency }) {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          phase ? (
            <Badge variant="outline" className="gap-1 font-medium">
              <Construction className="size-3" aria-hidden="true" />
              Phase {phase}
            </Badge>
          ) : null
        }
      />

      <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 p-6 sm:p-8">
        <h2 className="text-sm font-semibold">Not implemented yet</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This route exists so navigation, layout, theming, and accessibility can be reviewed end to
          end. The interface below arrives in its own phase — nothing here is simulated.
        </p>

        {items.length > 0 ? (
          <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[0.4375rem] size-1.5 shrink-0 rounded-full bg-primary/60"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {dependency ? (
          <p className="mt-5 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Backend dependency:</span> {dependency}
          </p>
        ) : null}
      </div>

      {/* Shape preview so the page skeleton is not an empty white area. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-3 h-6 w-12" />
            <Skeleton className="mt-4 h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
