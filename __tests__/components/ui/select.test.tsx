import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '@/components/ui/select'

describe('Select', () => {
  it('рендерится с опциями', () => {
    render(
      <Select>
        <option value="1">Опция 1</option>
        <option value="2">Опция 2</option>
      </Select>
    )
    expect(screen.getByText('Опция 1')).toBeInTheDocument()
    expect(screen.getByText('Опция 2')).toBeInTheDocument()
  })

  it('вызывает onChange при изменении значения', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(
      <Select onChange={handleChange}>
        <option value="1">Опция 1</option>
        <option value="2">Опция 2</option>
      </Select>
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '2')

    expect(handleChange).toHaveBeenCalled()
  })

  it('применяет size стили', () => {
    const { container } = render(<Select size="lg" />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('h-10')
  })

  it('применяет disabled состояние', () => {
    render(<Select disabled />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Select className="custom-select" />)
    const select = container.querySelector('.custom-select')
    expect(select).toBeInTheDocument()
  })
})
