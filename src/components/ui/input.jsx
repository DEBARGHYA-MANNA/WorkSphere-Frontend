import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Text input styled with design tokens.
 * Invalid state is driven by `aria-invalid` so validation is conveyed to AT too.
 */
const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-9 w-full rounded-lg border border-input bg-surface px-3 py-1 text-sm shadow-xs transition-colors',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
