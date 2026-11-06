import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2 } from 'lucide-react'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { useCreateOrganization } from '@/features/organizations/hooks/use-organizations'
import {
  createOrganizationDefaults,
  createOrganizationSchema,
} from '@/schemas/organization-schemas'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_MEMBER_ROLES } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Create-organization dialog.
 *
 * Slug collisions are detected server-side only (409 ORGANIZATION_SLUG_TAKEN),
 * because the slug is derived from the name and the client cannot know which
 * names are taken. That error is surfaced on the name field.
 */
export function CreateOrganizationDialog({ open, onOpenChange }) {
  const createOrganization = useCreateOrganization()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: createOrganizationDefaults,
  })

  const allowMemberInvites = watch('settings.allowMemberInvites')
  const defaultMemberRole = watch('settings.defaultMemberRole')

  const close = () => {
    reset(createOrganizationDefaults)
    setFormError(null)
    onOpenChange(false)
  }

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await createOrganization.mutateAsync(values)
      close()
    } catch (error) {
      // 409: the name maps to a slug that already exists.
      if (error?.status === 409) {
        setError('name', {
          type: 'server',
          message: 'An organization already uses this name. Try a different one.',
        })
        return
      }
      if (error?.status === 403) {
        setFormError('You do not have permission to create an organization.')
        return
      }
      if (error?.details && typeof error.details === 'object' && error.details.name) {
        setError('name', { type: 'server', message: error.details.name })
        return
      }
      setFormError(getErrorMessage(error))
    }
  }

  const busy = isSubmitting || createOrganization.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary-muted text-accent-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </div>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            You will become the Owner. You can invite your team once it exists.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

          <FormField label="Name" error={errors.name?.message} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                placeholder="Acme Corp"
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                disabled={busy}
                {...register('name')}
              />
            )}
          </FormField>

          <FormField
            label="Description"
            error={errors.description?.message}
            hint="Optional. Helps members recognize this workspace."
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                rows={3}
                placeholder="What does this organization do?"
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                disabled={busy}
                {...register('description')}
              />
            )}
          </FormField>

          <fieldset className="space-y-3 rounded-lg border border-border bg-surface-muted/40 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invitation policy
            </legend>

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="allow-member-invites" className="text-sm font-medium">
                  Allow member invites
                </Label>
                <p className="text-xs text-muted-foreground">
                  When off, only Owners and Admins can invite people.
                </p>
              </div>
              <Switch
                id="allow-member-invites"
                checked={Boolean(allowMemberInvites)}
                onCheckedChange={(checked) => setValue('settings.allowMemberInvites', checked)}
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default-member-role" className="text-sm font-medium">
                Default role for invited members
              </Label>
              <Select
                value={defaultMemberRole}
                onValueChange={(value) => setValue('settings.defaultMemberRole', value)}
                disabled={busy}
              >
                <SelectTrigger id="default-member-role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_MEMBER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {busy ? 'Creating…' : 'Create organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
