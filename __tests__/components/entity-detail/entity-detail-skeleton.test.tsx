import { render, screen } from '@testing-library/react'
import { EntityDetailSkeleton } from '@/components/entity-detail/entity-detail-skeleton'

describe('EntityDetailSkeleton', () => {
  it('рендерится с skeleton элементами', () => {
    const { container } = render(<EntityDetailSkeleton />)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('отображает skeleton для заголовка', () => {
    const { container } = render(<EntityDetailSkeleton />)
    const headerSkeleton = container.querySelector('.h-8')
    expect(headerSkeleton).toBeInTheDocument()
  })

  it('отображает skeleton для контента', () => {
    const { container } = render(<EntityDetailSkeleton />)
    const contentSkeleton = container.querySelector('.h-20')
    expect(contentSkeleton).toBeInTheDocument()
  })
})
