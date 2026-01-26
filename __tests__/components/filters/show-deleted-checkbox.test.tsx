import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShowDeletedCheckbox } from '@/components/filters/show-deleted-checkbox'

describe('ShowDeletedCheckbox', () => {
  it('рендерится с дефолтным лейблом', () => {
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox checked={false} onChange={mockOnChange} />
    )

    expect(screen.getByText('Показывать удаленные')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('рендерится с кастомным лейблом', () => {
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox
        label="Кастомный лейбл"
        checked={false}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText('Кастомный лейбл')).toBeInTheDocument()
  })

  it('отображает checked состояние', () => {
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox checked={true} onChange={mockOnChange} />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('отображает unchecked состояние', () => {
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox checked={false} onChange={mockOnChange} />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('вызывает onChange при изменении', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox checked={false} onChange={mockOnChange} />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith(true)
  })

  it('вызывает onChange с false при снятии галочки', async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox checked={true} onChange={mockOnChange} />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnChange).toHaveBeenCalledWith(false)
  })

  it('отображает описание, если передано', () => {
    const mockOnChange = jest.fn()
    render(
      <ShowDeletedCheckbox
        checked={false}
        onChange={mockOnChange}
        description="Описание чекбокса"
      />
    )

    expect(screen.getByText('Описание чекбокса')).toBeInTheDocument()
  })
})
