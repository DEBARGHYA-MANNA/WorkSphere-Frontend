import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  error: {
    icon: AlertCircle,
    className: 'border-destructive/30 bg-destructive-muted text-destructive',
    role: 'alert',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-success/30 bg-success-muted text-success',
    role: 'status',
  },
  info: {
    icon: Info,
    className: 'border-border bg-surface-muted text-muted-foreground',
    role: 'status',
  },
}

/**
 * Inline feedback for a form submission.
 *
 * Server errors are surfaced here as well as in a toast: a toast can disappear
 * before a screen-reader user reaches it, so the form keeps its own message.
 */
export function FormAlert({ variant = 'error', title, children, className, id }) {
  const config = VARIANTS[variant] ?? VARIANTS.error
  const Icon = config.icon

  return (
    <div
      id={id}
      role={config.role}
      aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        config.className,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-[0.8125rem] leading-relaxed">{children}</div> : null}
      </div>
    </div>
  )
}
