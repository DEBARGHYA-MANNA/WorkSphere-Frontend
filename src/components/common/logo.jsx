import { cn } from '@/lib/utils'

/**
 * WorkSphere wordmark + glyph.
 * The glyph is inline SVG so it inherits the current text colour and needs no
 * extra network request.
 */
export function Logo({ className, showText = true, size = 'md' }) {
  const dims = size === 'sm' ? 'size-7' : 'size-8'
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xs',
          dims,
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-[62%]" aria-hidden="true">
          <path
            d="M4 7.5h2.4l1.7 6 1.9-6h1.7l1.9 6 1.7-6H20l-3.3 9.5h-2L12.9 12l-1.8 5H9L4 7.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {showText ? (
        <span className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
          WorkSphere
        </span>
      ) : null}
    </span>
  )
}
