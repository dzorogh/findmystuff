import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoomsFiltersPanel, type RoomsFilters } from '@/components/filters/rooms-filters-panel'

describe('RoomsFiltersPanel', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnReset = jest.fn()

  const defaultFilters: RoomsFilters = {
    showDeleted: false,
    hasItems: null,
    hasContainers: null,
    hasPlaces: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('рендерится с фильтрами', () => {
    render(
      <RoomsFiltersPanel
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={false}
      />
    )

    expect(screen.getByText(/показывать удаленные помещения/i)).toBeInTheDocument()
    expect(screen.getByText(/есть вещи/i)).toBeInTheDocument()
    expect(screen.getByText(/есть контейнеры/i)).toBeInTheDocument()
    expect(screen.getByText(/есть места/i)).toBeInTheDocument()
  })

  it('не отображает кнопку сброса, когда hasActiveFilters = false', () => {
    render(
      <RoomsFiltersPanel
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
      <RoomsFiltersPanel
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
      <RoomsFiltersPanel
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

  it('отображает чекбокс showDeleted в правильном состоянии', () => {
    render(
      <RoomsFiltersPanel
        filters={{ ...defaultFilters, showDeleted: true }}
        onFiltersChange={mockOnFiltersChange}
        onReset={mockOnReset}
        hasActiveFilters={false}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('вызывает onFiltersChange при изменении showDeleted', async () => {
    const user = userEvent.setup()
    render(
      <RoomsFiltersPanel
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
