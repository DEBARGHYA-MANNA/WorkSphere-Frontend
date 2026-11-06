import { useState } from 'react'
import { format, formatDistanceToNowStrict, isPast } from 'date-fns'
import { Mail, Trash2, UserPlus } from 'lucide-react'
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
import { useInvitations, useRevokeInvitation } from '@/features/organizations/hooks/use-invitations'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/api-error'

/**
 * Pending invitations for an organization.
 *
 * The list only ever contains `pending`, unexpired invitations — that is what the
 * backend returns — so the copy says "pending", not "all invitations".
 */
export function InvitationList({ organizationId, actorRole, onInvite, canInvite }) {
  const { data, isLoading, isError, error, refetch } = useInvitations(organizationId)
  const revoke = useRevokeInvitation(organizationId)
  const [pendingRevoke, setPendingRevoke] = useState(null)
  const [actionError, setActionError] = useState(null)

  const canRevoke = hasPermission(actorRole, PERMISSIONS.INVITATION_REVOKE)
  const invitations = data?.items ?? []

  const confirmRevoke = async () => {
    setActionError(null)
    try {
      await revoke.mutateAsync(pendingRevoke.id)
      setPendingRevoke(null)
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="pending-invitations-heading">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 id="pending-invitations-heading" className="text-sm font-semibold tracking-tight">
            Pending invitations
          </h2>
          <p className="text-sm text-muted-foreground">
            People invited but not yet joined. Invitations expire after 7 days.
          </p>
        </div>
        {canInvite ? (
          <Button size="sm" onClick={onInvite}>
            <UserPlus aria-hidden="true" />
            Invite
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Loading invitations…</span>
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive-muted/50 p-4">
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(error, 'Could not load invitations.')}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No pending invitations"
          description={
            canInvite
              ? 'Invite a teammate by email to give them access to this organization.'
              : 'Nobody has been invited yet. Ask an Owner, Admin, or Manager to invite your team.'
          }
          action={
            canInvite ? (
              <Button size="sm" onClick={onInvite}>
                <UserPlus aria-hidden="true" />
                Invite a teammate
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {invitations.map((invitation) => {
            const expiresAt = invitation.expiresAt ? new Date(invitation.expiresAt) : null
            const expiringSoon = expiresAt && !isPast(expiresAt) && expiresAt - Date.now() < 864e5

            return (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{invitation.email}</p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{invitation.role}</span>
                    {expiresAt ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span title={format(expiresAt, 'PPpp')}>
                          {expiringSoon ? 'Expires ' : 'Expires in '}
                          {formatDistanceToNowStrict(expiresAt)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={expiringSoon ? 'warning' : 'muted'}>
                    {expiringSoon ? 'Expiring soon' : 'Pending'}
                  </Badge>
                  {canRevoke ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Revoke invitation for ${invitation.email}`}
                      onClick={() => setPendingRevoke(invitation)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(pendingRevoke)}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke this invitation?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{pendingRevoke?.email}</span> will no
              longer be able to use the invitation link. You can invite them again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingRevoke(null)}
              disabled={revoke.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" loading={revoke.isPending} onClick={confirmRevoke}>
              Revoke invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
