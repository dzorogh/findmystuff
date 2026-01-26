import { render, screen } from '@testing-library/react'
import { EntityLocation } from '@/components/entity-detail/entity-location'

describe('EntityLocation', () => {
  it('отображает сообщение, если location не указан', () => {
    render(<EntityLocation location={null} />)
    expect(screen.getByText(/местоположение не указано/i)).toBeInTheDocument()
  })

  it('отображает местоположение для room', () => {
    const location = {
      destination_type: 'room' as const,
      destination_id: 1,
      destination_name: 'Комната 1',
      moved_at: new Date().toISOString(),
    }

    render(<EntityLocation location={location} />)
    expect(screen.getByText('Комната 1')).toBeInTheDocument()
  })

  it('отображает местоположение для place', () => {
    const location = {
      destination_type: 'place' as const,
      destination_id: 1,
      destination_name: 'Место 1',
      room_name: 'Комната 1',
      moved_at: new Date().toISOString(),
    }

    render(<EntityLocation location={location} variant="detailed" />)
    expect(screen.getByText('Место 1')).toBeInTheDocument()
    expect(screen.getByText(/комната 1/i)).toBeInTheDocument()
  })

  it('отображает местоположение для container', () => {
    const location = {
      destination_type: 'container' as const,
      destination_id: 1,
      destination_name: 'Контейнер 1',
      place_name: 'Место 1',
      room_name: 'Комната 1',
      moved_at: new Date().toISOString(),
    }

    render(<EntityLocation location={location} variant="detailed" />)
    expect(screen.getByText('Контейнер 1')).toBeInTheDocument()
    expect(screen.getByText(/место 1/i)).toBeInTheDocument()
    expect(screen.getByText(/комната 1/i)).toBeInTheDocument()
  })

  it('использует дефолтное название, если destination_name не указан', () => {
    const location = {
      destination_type: 'room' as const,
      destination_id: 1,
      destination_name: null,
      moved_at: new Date().toISOString(),
    }

    render(<EntityLocation location={location} />)
    expect(screen.getByText(/помещение #1/i)).toBeInTheDocument()
  })

  it('отображает дату перемещения', () => {
    const movedAt = new Date('2024-01-15T10:30:00')
    const location = {
      destination_type: 'room' as const,
      destination_id: 1,
      destination_name: 'Комната 1',
      moved_at: movedAt.toISOString(),
    }

    render(<EntityLocation location={location} />)
    expect(screen.getByText(/перемещен/i)).toBeInTheDocument()
  })

  it('использует default variant', () => {
    const location = {
      destination_type: 'room' as const,
      destination_id: 1,
      destination_name: 'Комната 1',
      moved_at: new Date().toISOString(),
    }

    render(<EntityLocation location={location} />)
    expect(screen.getByText(/текущее местоположение/i)).toBeInTheDocument()
  })
})
