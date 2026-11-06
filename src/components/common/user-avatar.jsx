import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, initialsOf } from '@/lib/utils'

const SIZE_CLASSES = {
  xs: 'size-6 text-[0.625rem]',
  sm: 'size-8 text-[0.6875rem]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
}

/**
 * Avatar for a person record.
 * Falls back to initials when `avatarUrl` is missing or fails to load.
 */
export function UserAvatar({ name, email, src, size = 'md', className, ...props }) {
  const label = name || email || ''
  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)} {...props}>
      {src ? <AvatarImage src={src} alt="" loading="lazy" /> : null}
      <AvatarFallback>{initialsOf(label)}</AvatarFallback>
    </Avatar>
  )
}
