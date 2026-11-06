import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-0 bg-sidebar text-sidebar-foreground shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-sidebar-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t border-sidebar-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-[min(20rem,85vw)] border-r border-sidebar-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full w-[min(20rem,85vw)] border-l border-sidebar-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
    },
    defaultVariants: { side: 'left' },
  },
)

const SheetContent = React.forwardRef(
  ({ className, children, side = 'left', showClose = true, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-3 top-3 rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
)
SheetContent.displayName = 'SheetContent'

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-xs text-sidebar-muted', className)}
    {...props}
  />
))
SheetDescription.displayName = 'SheetDescription'

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription }
