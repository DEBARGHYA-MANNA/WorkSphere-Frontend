import { passwordStrength } from '@/schemas/auth-schemas'
import { cn } from '@/lib/utils'

const TONE = ['bg-muted', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success']

/**
 * Password strength guidance.
 * Purely advisory — the backend enforces "at least 12 characters". Text is shown
 * alongside the bars so the meaning never depends on colour alone.
 */
export function PasswordStrength({ password = '', className }) {
  const { score, label } = passwordStrength(password)
  if (!password) return null

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              score >= step ? TONE[Math.min(score, 4)] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        Password strength: <span className="font-medium text-foreground">{label}</span>
        {password.length < 12 ? ' — at least 12 characters required' : ''}
      </p>
    </div>
  )
}
