import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      title="Projects"
      description="Create, browse, and manage the projects your organization is running."
      phase="6"
      items={[
        'Grid and list views with real progress',
        'Create, edit, archive, restore, and delete',
        'Visibility and status filters',
        'Project membership management',
      ]}
      dependency="GET /organizations/:organizationId/projects — supports page, limit, q, status, visibility, archived, dueAfter, dueBefore, sort, order."
    />
  )
}
