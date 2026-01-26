import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('рендерится с текстом', () => {
    render(<Input defaultValue="Тестовый текст" />)
    const input = screen.getByDisplayValue('Тестовый текст')
    expect(input).toBeInTheDocument()
  })

  it('вызывает onChange при вводе', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'тест')

    expect(handleChange).toHaveBeenCalled()
  })

  it('применяет size стили', () => {
    const { container } = render(<Input size="lg" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('h-10')
  })

  it('применяет disabled состояние', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('применяет placeholder', () => {
    render(<Input placeholder="Введите текст" />)
    const input = screen.getByPlaceholderText('Введите текст')
    expect(input).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Input className="custom-class" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('custom-class')
  })

  it('передает дополнительные props', () => {
    render(<Input data-testid="custom-input" aria-label="Кастомный input" />)
    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('aria-label', 'Кастомный input')
  })
})
