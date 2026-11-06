import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Label + control + error/hint wiring.
 *
 * Keeps the accessibility contract identical across every auth form:
 *  - the label is programmatically associated with the control
 *  - `aria-invalid` marks the control
 *  - the error is announced (`role="alert"`) and referenced by `aria-describedby`
 *  - the hint stays referenced even when an error is present
 */
export function FormField({
  label,
  error,
  hint,
  required,
  className,
  children,
  id: providedId,
  ...props
}) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only">(required)</span> : null}
      </Label>

      {/* Children receive the id/aria wiring through a render prop. */}
      {typeof children === 'function'
        ? children({ id, describedBy: describedBy || undefined, invalid: Boolean(error) })
        : children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
