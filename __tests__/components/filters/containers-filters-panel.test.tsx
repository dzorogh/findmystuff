import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContainersFiltersPanel, type ContainersFilters } from '@/components/filters/containers-filters-panel'

const mockUseEntityTypes = jest.fn(() => ({
  types: [
    { id: 1, name: 'Коробка', code: 'КОР', category: 'container' },
    { id: 2, name: 'Пластиковый контейнер', code: 'ПЛА', category: 'container' },
  ],
  isLoading: false,
  error: null,
}))

jest.mock('@/hooks/use-entity-types', () => ({
  useEntityTypes: () => mockUseEntityTypes(),
}))

describe('ContainersFiltersPanel', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnReset = jest.fn()

  const defaultFilters: ContainersFilters = {
    showDeleted: false,
    entityTypeId: null,
    hasItems: null,
    locationType: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseEntityTypes.mockReturnValue({
      types: [
        { id: 1, name: 'Коробка', code: 'КОР', category: 'container' },
        { id: 2, name: 'Пластиковый контейнер', code: 'ПЛА', category: 'container' },
      ],
      isLoading: false,
      error: null,
    })
  })

  it('рендерится с фильтрами', () => {
    act(() => {
      render(
        <ContainersFiltersPanel
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
          hasActiveFilters={false}
        />
      )
    })

    expect(screen.getByText(/показывать удаленные контейнеры/i)).toBeInTheDocument()
    expect(screen.getByText(/тип контейнера/i)).toBeInTheDocument()
    expect(screen.getByText(/есть вещи внутри/i)).toBeInTheDocument()
    expect(screen.getByText(/тип местоположения/i)).toBeInTheDocument()
  })

  it('не отображает кнопку сброса, когда hasActiveFilters = false', () => {
    render(
      <ContainersFiltersPanel
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
      <ContainersFiltersPanel
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
      <ContainersFiltersPanel
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
      <ContainersFiltersPanel
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
