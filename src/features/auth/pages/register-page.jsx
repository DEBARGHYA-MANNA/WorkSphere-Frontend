import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrength } from '@/features/auth/components/password-strength'
import { useRegister } from '@/features/auth/hooks/use-auth-mutations'
import { REDIRECT_PARAM, safeRedirect } from '@/features/auth/redirect'
import { registerSchema } from '@/schemas/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registerMutation = useRegister()
  const [formError, setFormError] = useState(null)
  const [created, setCreated] = useState(null)

  const redirectParam = searchParams.get(REDIRECT_PARAM)
  const loginTarget = redirectParam
    ? `${ROUTES.login}?${REDIRECT_PARAM}=${encodeURIComponent(safeRedirect(redirectParam))}`
    : ROUTES.login

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
  })

  const password = watch('password')

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const data = await registerMutation.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      })

      // The backend decides whether a verification step is required. It ships
      // with EMAIL_VERIFICATION_ENABLED=false, so this is normally `false` and
      // the user can sign in immediately — we do not block them on an email that
      // will never arrive.
      if (data?.emailVerificationRequired) {
        setCreated({ email: values.email, verificationRequired: true })
        return
      }

      toast.success('Account created. Sign in to continue.')
      navigate(loginTarget, { replace: true })
    } catch (error) {
      if (error?.status === 409) {
        // The backend returns 409 for an already-registered email.
        setError('email', {
          type: 'server',
          message: 'An account with this email already exists. Try signing in instead.',
        })
        return
      }
      if (error?.details && typeof error.details === 'object') {
        let mapped = false
        for (const [field, message] of Object.entries(error.details)) {
          if (['name', 'email', 'password'].includes(field)) {
            setError(field, { type: 'server', message })
            mapped = true
          }
        }
        if (mapped) return
      }
      setFormError(getErrorMessage(error))
    }
  }

  if (created?.verificationRequired) {
    return (
      <AuthLayout
        title="Check your email"
        description="Email verification is currently required by this workspace."
        footer={
          <Link
            to={loginTarget}
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4">
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-full bg-primary-muted text-accent-foreground"
          >
            <MailCheck className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{' '}
            <span className="font-medium text-foreground">{created.email}</span>. Open it to
            activate your account, then sign in.
          </p>
          <FormAlert variant="info">
            Email delivery requires a configured mail transport on the backend. If no message
            arrives, ask your administrator to enable it.
          </FormAlert>
        </div>
      </AuthLayout>
    )
  }

  const busy = isSubmitting || registerMutation.isPending

  return (
    <AuthLayout
      title="Create your account"
      description="Start collaborating in a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={loginTarget}
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        <FormField label="Full name" error={errors.name?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy}
              {...register('name')}
            />
          )}
        </FormField>

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

        <FormField
          label="Password"
          error={errors.password?.message}
          hint="At least 12 characters. Long passphrases are ideal."
          required
        >
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

        <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
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
          {busy ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to your organization&apos;s usage policies.
        </p>
      </form>
    </AuthLayout>
  )
}
