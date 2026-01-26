import { render, screen } from '@testing-library/react'
import { EntityHeader } from '@/components/entity-detail/entity-header'
import { Package } from 'lucide-react'

describe('EntityHeader', () => {
  const defaultProps = {
    id: 1,
    name: 'Тестовая вещь',
    photoUrl: null,
    isDeleted: false,
    defaultIcon: <Package className="h-6 w-6" />,
    defaultName: 'Вещь',
    actions: <div>Actions</div>,
  }

  it('отображает название сущности', () => {
    render(<EntityHeader {...defaultProps} />)
    expect(screen.getByText('Тестовая вещь')).toBeInTheDocument()
  })

  it('отображает дефолтное название, если name не указан', () => {
    render(<EntityHeader {...defaultProps} name={null} />)
    expect(screen.getByText(/вещь #1/i)).toBeInTheDocument()
  })

  it('отображает ID по умолчанию', () => {
    render(<EntityHeader {...defaultProps} />)
    expect(screen.getByText(/ID: #1/i)).toBeInTheDocument()
  })

  it('скрывает ID, если showId = false', () => {
    render(<EntityHeader {...defaultProps} showId={false} />)
    expect(screen.queryByText(/ID: #1/i)).not.toBeInTheDocument()
  })

  it('отображает бейдж "Удалено" для удаленных сущностей', () => {
    render(<EntityHeader {...defaultProps} isDeleted={true} />)
    expect(screen.getByText(/удалено/i)).toBeInTheDocument()
  })

  it('использует compact layout', () => {
    const { container } = render(
      <EntityHeader {...defaultProps} layout="compact" />
    )
    const header = container.querySelector('.flex-col')
    expect(header).toBeInTheDocument()
  })

  it('отображает actions', () => {
    render(<EntityHeader {...defaultProps} />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
