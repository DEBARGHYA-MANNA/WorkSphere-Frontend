import { PlaceholderPage } from '@/components/common/placeholder-page'

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Your profile, password, organization preferences, and local appearance settings."
      phase="12"
      items={[
        'Profile details and avatar URL',
        'Password change and session revocation',
        'Organization details and invite policy',
        'Theme and local display preferences',
      ]}
    />
  )
}
