import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InvitationList } from '@/features/organizations/components/invitation-list'
import { InviteMemberDialog } from '@/features/organizations/components/invite-member-dialog'
import { OrganizationSettingsForm } from '@/features/organizations/components/organization-settings-form'
import {
  useDeleteOrganization,
  useOrganizations,
} from '@/features/organizations/hooks/use-organizations'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Organization settings: details, invitation policy, and pending invitations.
 *
 * Deletion is Owner-only (`organization:delete`) and irreversible — it removes
 * memberships, invitations, projects, and tasks — so it is behind an explicit
 * confirmation that names the organization.
 */
export default function OrganizationSettingsPage() {
  const navigate = useNavigate()
  const { activeOrganization, membershipRole, isLoading, isError, error, refetch } =
    useOrganizations()
  const deleteOrganization = useDeleteOrganization()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const canInvite = hasPermission(membershipRole, PERMISSIONS.MEMBER_INVITE)
  const canDelete = hasPermission(membershipRole, PERMISSIONS.ORGANIZATION_DELETE)

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only">Loading organization settings…</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive-muted/50 p-6">
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(error, 'Could not load this organization.')}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!activeOrganization) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Organization settings" />
        <EmptyState
          icon={Building2}
          title="No organization selected"
          description="Create an organization first — settings apply to the organization you are currently working in."
          action={
            <Button asChild>
              <a href={ROUTES.dashboard}>Back to dashboard</a>
            </Button>
          }
        />
      </div>
    )
  }

  const confirmDelete = async () => {
    setDeleteError(null)
    try {
      await deleteOrganization.mutateAsync(activeOrganization.id)
      setDeleteOpen(false)
      navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setDeleteError(
        err?.status === 403 ? 'Only the organization Owner can delete it.' : getErrorMessage(err),
      )
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title={activeOrganization.name}
        description="Organization details, invitation policy, and pending invitations."
        actions={<Badge variant="muted">Your role: {membershipRole}</Badge>}
      />

      <section
        aria-labelledby="details-heading"
        className="rounded-xl border border-border bg-card p-5"
      >
        <h2 id="details-heading" className="mb-4 text-sm font-semibold tracking-tight">
          Details
        </h2>
        <OrganizationSettingsForm organization={activeOrganization} actorRole={membershipRole} />
      </section>

      <InvitationList
        organizationId={activeOrganization.id}
        actorRole={membershipRole}
        canInvite={canInvite}
        onInvite={() => setInviteOpen(true)}
      />

      {canDelete ? (
        <section
          aria-labelledby="danger-heading"
          className="rounded-xl border border-destructive/30 bg-destructive-muted/40 p-5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
            >
              <TriangleAlert className="size-4" />
            </span>
            <div className="space-y-1">
              <h2 id="danger-heading" className="text-sm font-semibold text-destructive">
                Delete organization
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                This permanently removes the organization along with its memberships, invitations,
                projects, and tasks. This cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => setDeleteOpen(true)}
              >
                Delete this organization
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={activeOrganization.id}
        actorRole={membershipRole}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{activeOrganization.name}”?</DialogTitle>
            <DialogDescription>
              Every project, task, membership, and invitation in this organization will be removed
              permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2 text-sm text-destructive"
            >
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteOrganization.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteOrganization.isPending}
              onClick={confirmDelete}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
