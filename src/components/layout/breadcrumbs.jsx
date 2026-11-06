import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { buildBreadcrumbs } from '@/lib/breadcrumbs'
import { cn } from '@/lib/utils'

/**
 * Breadcrumb trail for the current route.
 *
 * Hidden when there is nothing to disambiguate (a single root segment), because
 * the page title already states the location. The final crumb is plain text with
 * `aria-current="page"` instead of a link to itself.
 */
export function Breadcrumbs({ labels, className }) {
  const { pathname } = useLocation()
  const items = buildBreadcrumbs(pathname, labels)

  if (items.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.to} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="size-3 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              ) : null}
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="truncate rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
