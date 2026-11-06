import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-colors duration-150 ease-out-expo',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:bg-destructive/95',
        outline:
          'border border-input bg-surface text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        subtle: 'bg-primary-muted text-accent-foreground hover:bg-primary-muted/70',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        xs: 'h-7 rounded-md px-2 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * Accessible button with variant + size presets.
 *
 * Renders `<button>` by default; pass `asChild` to delegate rendering to a single
 * child element (e.g. a React Router `<Link>`) while keeping the styles.
 *
 * Note: Radix `Slot` merges this component's props onto **exactly one** child.
 * The `asChild` branch therefore renders `children` untouched — wrapping them in
 * a fragment (or adding a spinner sibling) silently drops className and ARIA
 * attributes from the rendered element.
 */
const Button = React.forwardRef(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = Boolean(disabled || loading)

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        // `aria-disabled` also covers asChild renders (Link/label), where the
        // native `disabled` attribute does not apply.
        aria-disabled={isDisabled || undefined}
        disabled={asChild ? undefined : isDisabled}
        data-loading={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {children}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
