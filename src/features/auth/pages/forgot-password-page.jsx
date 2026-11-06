import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { useForgotPassword } from '@/features/auth/hooks/use-auth-mutations'
import { forgotPasswordSchema } from '@/schemas/auth-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [sentTo, setSentTo] = useState(null)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await forgot.mutateAsync(values)
      // The backend intentionally returns the same generic response whether or
      // not the account exists, so the UI must not imply the address was found.
      setSentTo(values.email)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        description="If an account exists for that address, a reset link is on its way."
        footer={
          <Link
            to={ROUTES.login}
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
            We sent reset instructions to{' '}
            <span className="font-medium text-foreground">{sentTo}</span> if that account exists.
            The link expires shortly and can only be used once.
          </p>
          <FormAlert variant="info">
            Password-reset email delivery requires a configured mail transport on the backend. If no
            message arrives, contact your administrator.
          </FormAlert>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  const busy = isSubmitting || forgot.isPending

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your account email and we will send reset instructions."
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

        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {busy ? 'Sending…' : 'Send reset instructions'}
        </Button>
      </form>
    </AuthLayout>
  )
}
