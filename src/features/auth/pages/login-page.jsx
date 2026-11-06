import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { PasswordInput } from '@/features/auth/components/password-input'
import { useLogin } from '@/features/auth/hooks/use-auth-mutations'
import { REDIRECT_PARAM, safeRedirect } from '@/features/auth/redirect'
import { loginSchema } from '@/schemas/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'
import { useAuthStore } from '@/features/auth/auth-store'

const ENDED_REASON_COPY = {
  signed_out: 'You have been signed out.',
  refresh_failed: 'Your session expired. Please sign in again.',
  session_expired: 'Your session expired. Please sign in again.',
  signed_out_elsewhere: 'You signed out in another tab.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()
  const endedReason = useAuthStore((state) => state.endedReason)
  const [formError, setFormError] = useState(null)

  const destination = safeRedirect(searchParams.get(REDIRECT_PARAM))

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      toast.success('Signed in successfully')
      // `replace` so the browser Back button does not return to the login form.
      navigate(destination, { replace: true })
    } catch (error) {
      // Field-level errors from the backend envelope (400/422) go on the inputs.
      if (error?.details && typeof error.details === 'object') {
        let mapped = false
        for (const [field, message] of Object.entries(error.details)) {
          if (field === 'email' || field === 'password') {
            setError(field, { type: 'server', message })
            mapped = true
          }
        }
        if (mapped) return
      }
      setFormError(getErrorMessage(error))
    }
  }

  const busy = isSubmitting || login.isPending

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back. Enter your details to continue."
      footer={
        <>
          New to WorkSphere?{' '}
          <Link
            to={ROUTES.register}
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {endedReason && !formError ? (
          <FormAlert variant="info">
            {ENDED_REASON_COPY[endedReason] ?? 'Please sign in again.'}
          </FormAlert>
        ) : null}

        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        <FormField label="Email" error={errors.email?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('email')}
            />
          )}
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('password')}
            />
          )}
        </FormField>

        <div className="flex justify-end">
          <Link
            to={ROUTES.forgotPassword}
            className="rounded text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sessions use an HttpOnly refresh cookie. Your password is never stored in the browser.
        </p>
      </form>
    </AuthLayout>
  )
}
