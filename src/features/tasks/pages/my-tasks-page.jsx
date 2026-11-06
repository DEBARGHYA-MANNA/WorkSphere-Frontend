import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function MyTasksPage() {
  return (
    <PlaceholderPage
      title="My Tasks"
      description="Every task assigned to you across the projects you can access in the current organization."
      phase="7"
      items={[
        'Assigned task list with server pagination',
        'Filter by status, priority, label, and due range',
        'Sort by due date, priority, and recency',
        'Inline status and assignee updates',
      ]}
    />
  )
}
