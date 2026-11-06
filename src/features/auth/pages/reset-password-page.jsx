import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrength } from '@/features/auth/components/password-strength'
import { useResetPassword } from '@/features/auth/hooks/use-auth-mutations'
import { resetPasswordSchema } from '@/schemas/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Reset password screen.
 *
 * The token arrives as `?token=…` from the reset email. The backend validates it
 * (single use, 32–256 chars) — the client never treats the token as proof of
 * anything and never logs it.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reset = useResetPassword()
  const [formError, setFormError] = useState(null)

  const tokenFromUrl = searchParams.get('token') ?? ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl, password: '', confirmPassword: '' },
  })

  const password = watch('password')
  const busy = isSubmitting || reset.isPending

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await reset.mutateAsync({ token: values.token.trim(), password: values.password })
      toast.success('Password updated. Sign in with your new password.')
      navigate(ROUTES.login, { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description="Your reset link can only be used once."
      footer={
        <Link
          to={ROUTES.login}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        {!tokenFromUrl ? (
          <FormAlert variant="info">
            No reset token was found in the link. Paste the token from your email below, or request
            a new one from the{' '}
            <Link to={ROUTES.forgotPassword} className="font-medium underline underline-offset-2">
              forgot password
            </Link>{' '}
            page.
          </FormAlert>
        ) : null}

        <FormField
          label="Reset token"
          error={errors.token?.message}
          hint={tokenFromUrl ? 'Filled in from your reset link.' : undefined}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="one-time-code"
              spellCheck={false}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('token')}
            />
          )}
        </FormField>

        <FormField label="New password" error={errors.password?.message} required>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('password')}
            />
          )}
        </FormField>

        <PasswordStrength password={password} />

        <FormField label="Confirm new password" error={errors.confirmPassword?.message} required>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('confirmPassword')}
            />
          )}
        </FormField>

        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
