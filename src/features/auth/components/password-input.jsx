import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Password input with a show/hide control.
 *
 * Must be a `forwardRef` component: React Hook Form's `register()` returns a
 * `ref` that it uses to read the field value. Without forwarding it, the input
 * looks correct but submits as empty.
 *
 * The toggle is a real button with a state-reflecting accessible name, so it is
 * keyboard reachable and understandable to screen readers.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { className, id, autoComplete = 'current-password', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        ref={ref}
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={0}
        className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
})
