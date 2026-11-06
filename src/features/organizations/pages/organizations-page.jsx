import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Plus, Settings2, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateOrganizationDialog } from '@/features/organizations/components/create-organization-dialog'
import {
  useOrganizations,
  useSwitchOrganization,
} from '@/features/organizations/hooks/use-organizations'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/api-error'
import { cn, initialsOf } from '@/lib/utils'

/**
 * Organization list — every organization the signed-in user is an active member
 * of, with the current context clearly marked.
 */
export default function OrganizationsPage() {
  const { organizations, activeOrganization, isLoading, isError, error, refetch } =
    useOrganizations()
  const switchOrganization = useSwitchOrganization()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Organizations"
        description="Workspaces you belong to. Switching changes the projects, tasks, and people you see."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            New organization
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <span className="sr-only">Loading organizations…</span>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive-muted/50 p-6">
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(error, 'Could not load your organizations.')}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to start adding projects and inviting your team."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Create organization
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => {
            const isActive = organization.id === activeOrganization?.id
            return (
              <li key={organization.id}>
                <Card
                  className={cn(
                    'h-full transition-colors',
                    isActive && 'border-primary/40 ring-1 ring-primary/20',
                  )}
                >
                  <CardHeader className="flex-row items-start gap-3 space-y-0">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-xs font-semibold text-accent-foreground"
                    >
                      {initialsOf(organization.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{organization.name}</CardTitle>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="muted">{organization.role}</Badge>
                        {isActive ? <Badge variant="accent">Current</Badge> : null}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                      {organization.description || 'No description yet.'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {isActive ? (
                        <>
                          <Button asChild size="sm" variant="outline">
                            <Link to={ROUTES.organizationSettings}>
                              <Settings2 aria-hidden="true" />
                              Settings
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link to={ROUTES.members}>
                              <Users aria-hidden="true" />
                              Members
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={
                            switchOrganization.isPending &&
                            switchOrganization.variables === organization.id
                          }
                          onClick={() => switchOrganization.mutate(organization.id)}
                        >
                          Switch to this organization
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
