import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function MembersPage() {
  return (
    <PlaceholderPage
      title="Team Members"
      description="People with access to this organization, their roles, and pending invitations."
      phase="5"
      items={[
        'Paginated member directory',
        'Role assignment with hierarchy rules',
        'Pending invitation status and revocation',
        'Permission-aware actions',
      ]}
      dependency="GET /organizations/:organizationId/members (page, limit only — the API exposes no member search parameter) plus /invitations."
    />
  )
}
