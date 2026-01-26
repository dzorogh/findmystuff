import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlacesFiltersPanel, type PlacesFilters } from '@/components/filters/places-filters-panel'

const mockUseEntityTypes = jest.fn(() => ({
  types: [
    { id: 1, name: 'Полка', code: 'ПОЛ', category: 'place' },
    { id: 2, name: 'Стол', code: 'СТОЛ', category: 'place' },
  ],
  isLoading: false,
  error: null,
}))

const mockUseRooms = jest.fn(() => ({
  rooms: [{ id: 1, name: 'Комната 1' }],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}))

jest.mock('@/hooks/use-entity-types', () => ({
  useEntityTypes: () => mockUseEntityTypes(),
}))

jest.mock('@/hooks/use-rooms', () => ({
  useRooms: () => mockUseRooms(),
}))

describe('PlacesFiltersPanel', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnReset = jest.fn()

  const defaultFilters: PlacesFilters = {
    showDeleted: false,
    entityTypeId: null,
    roomId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseEntityTypes.mockReturnValue({
      types: [
        { id: 1, name: 'Полка', code: 'ПОЛ', category: 'place' },
        { id: 2, name: 'Стол', code: 'СТОЛ', category: 'place' },
      ],
      isLoading: false,
      error: null,
    })
    mockUseRooms.mockReturnValue({
      rooms: [{ id: 1, name: 'Комната 1' }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('рендерится с фильтрами', () => {
    act(() => {
      render(
        <PlacesFiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
          hasActiveFilters={false}
        />
      )
    })

    expect(screen.getByText(/показывать удаленные места/i)).toBeInTheDocument()
    expect(screen.getByText(/тип места/i)).toBeInTheDocument()
    expect(screen.getByText(/помещение/i)).toBeInTheDocument()
  })

  it('не отображает кнопку сброса, когда hasActiveFilters = false', () => {
    render(
      <PlacesFiltersPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={false}
      />
    )

    expect(screen.queryByText(/сбросить фильтры/i)).not.toBeInTheDocument()
  })

  it('отображает кнопку сброса, когда hasActiveFilters = true', () => {
    render(
      <PlacesFiltersPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={true}
      />
    )

    expect(screen.getByText(/сбросить фильтры/i)).toBeInTheDocument()
  })

  it('вызывает onReset при клике на кнопку сброса', async () => {
    const user = userEvent.setup()
    render(
      <PlacesFiltersPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={true}
      />
    )

    const resetButton = screen.getByText(/сбросить фильтры/i)
    await user.click(resetButton)

    expect(mockOnReset).toHaveBeenCalledTimes(1)
  })

  it('вызывает onFiltersChange при изменении showDeleted', async () => {
    const user = userEvent.setup()
    render(
      <PlacesFiltersPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={false}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      showDeleted: true,
    })
  })
})
