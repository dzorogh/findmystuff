import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemsFiltersPanel, type ItemsFilters } from '@/components/filters/items-filters-panel'

const mockUseRooms = jest.fn(() => ({
  rooms: [{ id: 1, name: 'Комната 1' }],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}))

jest.mock('@/lib/rooms/hooks/use-rooms', () => ({
  useRooms: () => mockUseRooms(),
}))

describe('ItemsFiltersPanel', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnReset = jest.fn()

  const defaultFilters: ItemsFilters = {
    showDeleted: false,
    locationType: null,
    hasPhoto: null,
    roomId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
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
        <ItemsFiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
          hasActiveFilters={false}
        />
      )
    })

    expect(screen.getByText(/показывать удаленные вещи/i)).toBeInTheDocument()
    expect(screen.getByText(/тип местоположения/i)).toBeInTheDocument()
    expect(screen.getByText(/есть фото/i)).toBeInTheDocument()
    expect(screen.getByText(/помещение/i)).toBeInTheDocument()
  })

  it('не отображает кнопку сброса, когда hasActiveFilters = false', () => {
    render(
      <ItemsFiltersPanel
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
      <ItemsFiltersPanel
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
      <ItemsFiltersPanel
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
      <ItemsFiltersPanel
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
