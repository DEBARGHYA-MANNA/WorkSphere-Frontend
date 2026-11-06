import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/hooks/use-theme'

/**
 * Application toast host.
 * Colours come from the design tokens so toasts match both themes.
 */
export function Toaster(props) {
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      offset={16}
      gap={8}
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-lg !font-sans',
          title: '!text-sm !font-medium',
          description: '!text-sm !text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-muted !text-muted-foreground',
          closeButton: '!border-border !bg-popover !text-muted-foreground',
          success: '[&_[data-icon]]:!text-success',
          error: '[&_[data-icon]]:!text-destructive',
          warning: '[&_[data-icon]]:!text-warning',
          info: '[&_[data-icon]]:!text-info',
        },
      }}
      {...props}
    />
  )
}
