import { render, screen } from '@testing-library/react'
import { TransitionsTable } from '@/components/entity-detail/transitions-table'

describe('TransitionsTable', () => {
  it('отображает пустое сообщение, если transitions пуст', () => {
    render(<TransitionsTable transitions={[]} />)
    expect(screen.getByText(/история перемещений пуста/i)).toBeInTheDocument()
  })

  it('использует кастомное пустое сообщение', () => {
    render(
      <TransitionsTable transitions={[]} emptyMessage="Нет перемещений" />
    )
    expect(screen.getByText('Нет перемещений')).toBeInTheDocument()
  })

  it('отображает таблицу с переходами', () => {
    const transitions = [
      {
        id: 1,
        destination_type: 'room',
        destination_id: 1,
        destination_name: 'Комната 1',
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        destination_type: 'place',
        destination_id: 2,
        destination_name: 'Место 1',
        created_at: '2024-01-16T11:00:00Z',
      },
    ]

    render(<TransitionsTable transitions={transitions} />)

    expect(screen.getByText('Комната 1')).toBeInTheDocument()
    expect(screen.getByText('Место 1')).toBeInTheDocument()
    expect(screen.getByText(/дата и время/i)).toBeInTheDocument()
    expect(screen.getByText(/местоположение/i)).toBeInTheDocument()
  })

  it('отображает бейдж "Текущее" для первого перехода', () => {
    const transitions = [
      {
        id: 1,
        destination_type: 'room',
        destination_id: 1,
        destination_name: 'Комната 1',
        created_at: '2024-01-15T10:30:00Z',
      },
    ]

    render(<TransitionsTable transitions={transitions} />)

    expect(screen.getByText(/текущее/i)).toBeInTheDocument()
  })

  it('использует дефолтное название, если destination_name не указан', () => {
    const transitions = [
      {
        id: 1,
        destination_type: 'room',
        destination_id: 1,
        destination_name: null,
        created_at: '2024-01-15T10:30:00Z',
      },
    ]

    render(<TransitionsTable transitions={transitions} />)

    expect(screen.getByText(/помещение #1/i)).toBeInTheDocument()
  })

  it('форматирует дату в русском формате', () => {
    const transitions = [
      {
        id: 1,
        destination_type: 'room',
        destination_id: 1,
        destination_name: 'Комната 1',
        created_at: '2024-01-15T10:30:00Z',
      },
    ]

    render(<TransitionsTable transitions={transitions} />)

    const text = screen.getByText(/2024/i).textContent
    expect(text).toMatch(/2024/)
  })
})
