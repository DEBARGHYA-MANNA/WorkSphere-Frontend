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
    />
  )
}
