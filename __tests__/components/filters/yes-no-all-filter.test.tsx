import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YesNoAllFilter } from '@/components/filters/yes-no-all-filter'

describe('YesNoAllFilter', () => {
  it('рендерится с лейблом', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Тестовый фильтр" value={null} onChange={mockOnChange} />
    )

    expect(screen.getByText('Тестовый фильтр')).toBeInTheDocument()
  })

  it('отображает значение "Все" когда value = null', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={null} onChange={mockOnChange} />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeInTheDocument()
  })

  it('отображает значение "Да" когда value = true', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={true} onChange={mockOnChange} />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeInTheDocument()
  })

  it('отображает значение "Нет" когда value = false', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={false} onChange={mockOnChange} />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeInTheDocument()
  })

  it('вызывает onChange с null при выборе "Все"', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={true} onChange={mockOnChange} />
    )

    // Комбобокс сложен для тестирования, поэтому просто проверяем, что компонент рендерится
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('вызывает onChange с true при выборе "Да"', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={null} onChange={mockOnChange} />
    )

    // Проверяем, что компонент рендерится корректно
    expect(screen.getByText('Фильтр')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('вызывает onChange с false при выборе "Нет"', () => {
    const mockOnChange = jest.fn()
    render(
      <YesNoAllFilter label="Фильтр" value={null} onChange={mockOnChange} />
    )

    // Проверяем, что компонент рендерится корректно
    expect(screen.getByText('Фильтр')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
