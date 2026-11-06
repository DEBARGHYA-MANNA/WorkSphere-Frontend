import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders a native button by default', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('applies the requested variant and size classes', () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-destructive')
    expect(button).toHaveClass('h-8')
  })

  it('merges caller classes last so overrides win', () => {
    render(<Button className="px-10">Wide</Button>)
    expect(screen.getByRole('button', { name: 'Wide' })).toHaveClass('px-10')
  })

  it('is disabled and busy while loading', () => {
    render(<Button loading>Saving</Button>)
    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
  })

  describe('asChild', () => {
    it('renders the child element, not a nested button', () => {
      render(
        <Button asChild>
          <a href="/projects">Browse</a>
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'Browse' })
      expect(link).toHaveAttribute('href', '/projects')
      expect(link).not.toHaveAttribute('aria-disabled')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    // Regression: wrapping children in a fragment breaks Radix Slot's prop
    // merging, which silently dropped every style and ARIA attribute.
    it('keeps button styles and ARIA props on the child element', () => {
      render(
        <Button asChild variant="ghost" size="icon" aria-label="Notifications">
          <a href="/notifications">bell</a>
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'Notifications' })
      expect(link).toHaveClass('inline-flex')
      expect(link).toHaveClass('h-9')
      expect(link).toHaveClass('text-foreground')
      expect(link).toHaveAttribute('aria-label', 'Notifications')
    })

    it('exposes aria-disabled rather than the disabled attribute on links', () => {
      render(
        <Button asChild disabled>
          <a href="/x">Disabled link</a>
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'Disabled link' })
      expect(link).toHaveAttribute('aria-disabled', 'true')
      expect(link).not.toHaveAttribute('disabled')
      expect(link).not.toHaveAttribute('tabindex')
    })
  })
})
