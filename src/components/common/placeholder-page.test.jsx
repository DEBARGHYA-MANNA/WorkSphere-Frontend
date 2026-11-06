import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlaceholderPage } from '@/components/common/placeholder-page'

describe('PlaceholderPage', () => {
  it('announces the feature, phase and pending items', () => {
    render(
      <PlaceholderPage
        title="Projects"
        description="Manage projects"
        phase="6"
        items={['Grid view', 'Archive project']}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Phase 6')).toBeInTheDocument()
    expect(screen.getByText('Manage projects')).toBeInTheDocument()
    expect(screen.getByText('Grid view')).toBeInTheDocument()
    expect(screen.getByText('Archive project')).toBeInTheDocument()
  })

  it('omits the item list when none is provided', () => {
    render(<PlaceholderPage title="Members" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Members' })).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
