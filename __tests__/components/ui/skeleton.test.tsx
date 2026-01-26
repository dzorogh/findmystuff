import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  it('рендерится с дефолтными стилями', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />)
    const skeleton = container.querySelector('.custom-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('рендерится с содержимым', () => {
    const { container } = render(<Skeleton>Загрузка...</Skeleton>)
    expect(container.textContent).toBe('Загрузка...')
  })
})
