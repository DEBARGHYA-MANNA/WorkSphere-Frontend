import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormAlert } from '@/features/auth/components/form-alert'
import { FormField } from '@/features/auth/components/form-field'
import { useUpdateOrganization } from '@/features/organizations/hooks/use-organizations'
import { updateOrganizationSchema } from '@/schemas/organization-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_MEMBER_ROLES, PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Organization details + invitation policy.
 *
 * Read-only for members without `organization:update` (Manager, Member, Viewer).
 * The backend enforces this too; disabling the form avoids a pointless 403.
 */
export function OrganizationSettingsForm({ organization, actorRole }) {
  const canUpdate = hasPermission(actorRole, PERMISSIONS.ORGANIZATION_UPDATE)
  const update = useUpdateOrganization(organization?.id)
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: organization?.name ?? '',
      description: organization?.description ?? '',
      settings: {
        allowMemberInvites: organization?.settings?.allowMemberInvites ?? true,
        defaultMemberRole: organization?.settings?.defaultMemberRole ?? 'Member',
      },
    },
  })

  // Re-seed when the organization changes (after a switch or a refetch).
  useEffect(() => {
    if (!organization) return
    reset({
      name: organization.name ?? '',
      description: organization.description ?? '',
      settings: {
        allowMemberInvites: organization.settings?.allowMemberInvites ?? true,
        defaultMemberRole: organization.settings?.defaultMemberRole ?? 'Member',
      },
    })
  }, [organization, reset])

  const allowMemberInvites = watch('settings.allowMemberInvites')
  const defaultMemberRole = watch('settings.defaultMemberRole')

  const onSubmit = async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      await update.mutateAsync({
        name: values.name,
        description: values.description ?? '',
        settings: {
          allowMemberInvites: values.settings.allowMemberInvites,
          defaultMemberRole: values.settings.defaultMemberRole,
        },
      })
      setSaved(true)
    } catch (error) {
      if (error?.status === 409) {
        setError('name', {
          type: 'server',
          message: 'Another organization already uses this name.',
        })
        return
      }
      if (error?.status === 403) {
        setFormError('Your role cannot change organization settings.')
        return
      }
      if (error?.details && typeof error.details === 'object') {
        let mapped = false
        for (const [field, message] of Object.entries(error.details)) {
          if (field === 'name' || field === 'description') {
            setError(field, { type: 'server', message })
            mapped = true
          }
        }
        if (mapped) return
      }
      setFormError(getErrorMessage(error))
    }
  }

  const busy = isSubmitting || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {!canUpdate ? (
        <FormAlert variant="info">
          You have read-only access. Only Owners and Admins can change organization settings.
        </FormAlert>
      ) : null}

      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      {saved && !formError ? (
        <FormAlert variant="success">Organization details saved.</FormAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" error={errors.name?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              disabled={busy || !canUpdate}
              {...register('name')}
            />
          )}
        </FormField>

        <FormField label="Slug" hint="Generated from the name and used in URLs. Not editable.">
          {() => <Input value={organization?.slug ?? ''} readOnly disabled aria-readonly="true" />}
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            rows={3}
            placeholder="What does this organization work on?"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            disabled={busy || !canUpdate}
            {...register('description')}
          />
        )}
      </FormField>

      <fieldset
        className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4"
        disabled={busy || !canUpdate}
      >
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Invitation policy
        </legend>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="org-allow-invites" className="text-sm font-medium">
              Allow member invites
            </Label>
            <p className="text-xs text-muted-foreground">
              When off, only Owners and Admins can invite people to this organization.
            </p>
          </div>
          <Switch
            id="org-allow-invites"
            checked={Boolean(allowMemberInvites)}
            onCheckedChange={(checked) =>
              setValue('settings.allowMemberInvites', checked, { shouldDirty: true })
            }
            disabled={busy || !canUpdate}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-default-role" className="text-sm font-medium">
            Default role for invited members
          </Label>
          <Select
            value={defaultMemberRole}
            onValueChange={(value) =>
              setValue('settings.defaultMemberRole', value, { shouldDirty: true })
            }
            disabled={busy || !canUpdate}
          >
            <SelectTrigger id="org-default-role" className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_MEMBER_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used when an invitation does not specify a role.
          </p>
        </div>
      </fieldset>

      {canUpdate ? (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !isDirty}
            onClick={() => {
              reset()
              setSaved(false)
            }}
          >
            Reset
          </Button>
          <Button type="submit" loading={busy} disabled={!isDirty}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      ) : null}
    </form>
  )
}
