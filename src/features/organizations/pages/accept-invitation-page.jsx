import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 } from 'lucide-react'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { useAcceptInvitation } from '@/features/organizations/hooks/use-invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'

/** Mirrors the backend: token is 32–256 chars of `[A-Za-z0-9_-]`. */
const acceptSchema = z.object({
  token: z
    .string({ required_error: 'Invitation token is required' })
    .trim()
    .min(32, 'Invitation token looks incomplete')
    .max(256, 'Invitation token is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invitation token contains invalid characters'),
})

/**
 * Accept an organization invitation.
 *
 * Requires an authenticated session whose email matches the invitation — the
 * backend enforces the match and rejects a mismatch with a single generic
 * `INVALID_INVITATION` message so invitations cannot be probed.
 */
export default function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accept = useAcceptInvitation()
  const [formError, setFormError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)

  const tokenFromUrl = searchParams.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(acceptSchema),
    defaultValues: { token: tokenFromUrl },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    setErrorCode(null)
    try {
      await accept.mutateAsync({ token: values.token.trim() })
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      setErrorCode(error?.serverCode ?? null)
      setFormError(getErrorMessage(error, 'This invitation could not be accepted.'))
    }
  }

  const busy = isSubmitting || accept.isPending

  return (
    <AuthLayout
      title="Accept invitation"
      description="Join the organization you were invited to."
      footer={
        <Link
          to={ROUTES.dashboard}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Not now, take me to the dashboard
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? (
          <FormAlert variant="error" title="Invitation not accepted">
            {formError}
          </FormAlert>
        ) : null}

        {errorCode === 'INVALID_INVITATION' ? (
          <FormAlert variant="info">
            An invitation is only valid for the email address it was sent to, and it expires after 7
            days. Ask an administrator to send a new one if this link is out of date.
          </FormAlert>
        ) : null}

        {errorCode === 'ALREADY_A_MEMBER' ? (
          <FormAlert variant="info">
            You are already a member of this organization, so there is nothing else to accept.
          </FormAlert>
        ) : null}

        {!tokenFromUrl ? (
          <FormAlert variant="info">
            No invitation token was found in the link. Paste the token from your invitation email
            below.
          </FormAlert>
        ) : null}

        <FormField
          label="Invitation token"
          error={errors.token?.message}
          hint={tokenFromUrl ? 'Filled in from your invitation link.' : undefined}
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

        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {busy ? 'Joining…' : 'Accept invitation'}
        </Button>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Building2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Invitations are tied to the email address of your signed-in account. If you were invited
          at a different address, sign in with that account first.
        </p>
      </form>
    </AuthLayout>
  )
}
