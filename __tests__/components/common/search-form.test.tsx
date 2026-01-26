import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/common/search-form'

describe('SearchForm', () => {
  const defaultProps = {
    title: 'Поиск',
    description: 'Описание поиска',
    placeholder: 'Введите запрос',
    searchQuery: '',
    onSearchChange: jest.fn(),
    isSearching: false,
    resultsCount: 0,
    resultsLabel: {
      singular: 'результат',
      plural: 'результатов',
    },
    showDeleted: false,
    onToggleDeleted: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает заголовок и описание', () => {
    render(<SearchForm {...defaultProps} />)
    expect(screen.getByText('Поиск')).toBeInTheDocument()
    expect(screen.getByText('Описание поиска')).toBeInTheDocument()
  })

  it('отображает поле поиска', () => {
    render(<SearchForm {...defaultProps} />)
    expect(screen.getByPlaceholderText('Введите запрос')).toBeInTheDocument()
  })

  it('вызывает onSearchChange при вводе', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<SearchForm {...defaultProps} onSearchChange={handleChange} />)

    const input = screen.getByPlaceholderText('Введите запрос')
    await user.type(input, 'тест')

    expect(handleChange).toHaveBeenCalled()
  })

  it('отображает индикатор загрузки', () => {
    const { container } = render(
      <SearchForm {...defaultProps} isSearching={true} />
    )
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('отображает количество результатов', () => {
    render(<SearchForm {...defaultProps} searchQuery="тест" resultsCount={5} />)
    expect(screen.getByText(/найдено: 5/i)).toBeInTheDocument()
  })

  it('использует singular форму для 1 результата', () => {
    render(
      <SearchForm
        {...defaultProps}
        searchQuery="тест"
        resultsCount={1}
        resultsLabel={{ singular: 'вещь', plural: 'вещей' }}
      />
    )
    expect(screen.getByText(/1 вещь/i)).toBeInTheDocument()
  })

  it('переключает показ удаленных', async () => {
    const user = userEvent.setup()
    const handleToggle = jest.fn()
    render(
      <SearchForm {...defaultProps} onToggleDeleted={handleToggle} />
    )

    await user.click(screen.getByText(/показать удаленные/i))
    expect(handleToggle).toHaveBeenCalledTimes(1)
  })
})
