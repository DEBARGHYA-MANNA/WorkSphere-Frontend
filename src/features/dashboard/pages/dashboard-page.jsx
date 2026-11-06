import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Organization-wide metrics, overdue work, upcoming deadlines, project progress, and productivity trends."
      phase="11"
      items={[
        'Task and completion overview',
        'Overdue and upcoming deadlines',
        'Project progress from analytics data',
        'Productivity trend charts with date filters',
        'Recent activity feed',
      ]}
      dependency="GET /organizations/:organizationId/analytics (overview, taskDistribution, productivity) and GET /organizations/:organizationId/activity."
    />
  )
}
