import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/empty-state'
import { Package } from 'lucide-react'

describe('EmptyState', () => {
  it('отображает заголовок', () => {
    render(<EmptyState icon={Package} title="Нет данных" />)
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('отображает описание, если передано', () => {
    render(
      <EmptyState
        icon={Package}
        title="Нет данных"
        description="Попробуйте изменить фильтры"
      />
    )
    expect(screen.getByText('Попробуйте изменить фильтры')).toBeInTheDocument()
  })

  it('не отображает описание, если не передано', () => {
    render(<EmptyState icon={Package} title="Нет данных" />)
    expect(screen.queryByText(/попробуйте/i)).not.toBeInTheDocument()
  })

  it('отображает иконку', () => {
    const { container } = render(<EmptyState icon={Package} title="Нет данных" />)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
