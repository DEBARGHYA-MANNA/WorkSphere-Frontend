import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="Notifications"
      description="Mentions, assignments, comment updates, and deadline reminders for the current organization."
      phase="10"
      items={[
        'Notification center with unread count',
        'Mark one or all as read',
        'Filter by category and unread state',
        'Navigate to the related task',
      ]}
    />
  )
}
