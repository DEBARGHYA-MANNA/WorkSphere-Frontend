import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { useCreateInvitation } from '@/features/organizations/hooks/use-invitations'
import { inviteMemberDefaults, inviteMemberSchema } from '@/schemas/organization-schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { assignableRolesFor } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Invite a person to the organization.
 *
 * Two honest constraints shape this dialog:
 *
 *  1. **The invite link cannot be shown.** The API never returns the invitation
 *     token — it only travels in the email — so there is no "copy link" action,
 *     and the dialog says so instead of implying one exists.
 *  2. **Email delivery is not guaranteed.** The backend mailer is a no-op unless a
 *     transport is configured, so the copy never claims "an email was sent".
 */
export function InviteMemberDialog({ open, onOpenChange, organizationId, actorRole }) {
  const createInvitation = useCreateInvitation(organizationId)
  const [formError, setFormError] = useState(null)
  const [result, setResult] = useState(null)

  const roles = assignableRolesFor(actorRole)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      ...inviteMemberDefaults,
      role: roles.includes('Member') ? 'Member' : (roles[0] ?? ''),
    },
  })

  const role = watch('role')

  const close = () => {
    reset(inviteMemberDefaults)
    setFormError(null)
    setResult(null)
    onOpenChange(false)
  }

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const { invitation } = await createInvitation.mutateAsync({
        email: values.email,
        role: values.role || undefined,
      })
      setResult({ email: invitation?.email ?? values.email, role: invitation?.role ?? values.role })
    } catch (error) {
      switch (error?.status) {
        case 409:
          setError('email', {
            type: 'server',
            message:
              error.serverCode === 'ALREADY_A_MEMBER'
                ? 'This person is already a member of the organization.'
                : 'A pending invitation already exists for this email.',
          })
          return
        case 403:
          setFormError(
            error.serverCode === 'INVITATIONS_DISABLED'
              ? 'Member invitations are disabled by this organization\u2019s settings.'
              : 'You cannot invite someone with that role.',
          )
          return
        default:
          break
      }
      if (error?.details?.email) {
        setError('email', { type: 'server', message: error.details.email })
        return
      }
      setFormError(getErrorMessage(error))
    }
  }

  const busy = isSubmitting || createInvitation.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary-muted text-accent-foreground">
            <UserPlus className="size-4" aria-hidden="true" />
          </div>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Send an invitation to join this organization.</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <FormAlert variant="success" title={`Invitation created for ${result.email}`}>
              They will join as <span className="font-medium">{result.role}</span> once they accept.
            </FormAlert>

            <FormAlert variant="info" title="What happens next">
              The invitation link is sent by email — the API never returns it, so it cannot be
              copied from here. Email delivery requires a configured mail transport on the backend;
              if none is set up, the invitation stays pending without a message being sent.
            </FormAlert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Done
              </Button>
              <Button type="button" onClick={() => setResult(null)}>
                Invite someone else
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

            <FormField label="Email" error={errors.email?.message} required>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="teammate@company.com"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  disabled={busy}
                  {...register('email')}
                />
              )}
            </FormField>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value)}
                disabled={busy || roles.length === 0}
              >
                <SelectTrigger
                  id="invite-role"
                  className="w-full"
                  aria-describedby="invite-role-hint"
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="invite-role-hint" className="text-xs text-muted-foreground">
                {roles.length === 0
                  ? 'Your role cannot assign any role. Ask an Owner or Admin to invite people.'
                  : 'You can only assign roles below your own.'}
              </p>
            </div>

            <FormAlert variant="info">
              The invite link is delivered by email only. It is never returned by the API, so it
              cannot be displayed or copied here.
            </FormAlert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} disabled={roles.length === 0}>
                {busy ? 'Sending…' : 'Create invitation'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
