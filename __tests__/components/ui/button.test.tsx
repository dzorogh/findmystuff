import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('рендерится с текстом', () => {
    render(<Button>Нажми меня</Button>)
    expect(screen.getByRole('button', { name: /нажми меня/i })).toBeInTheDocument()
  })

  it('вызывает onClick при клике', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Кнопка</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('не вызывает onClick, когда disabled', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(
      <Button onClick={handleClick} disabled>
        Кнопка
      </Button>
    )

    const button = screen.getByRole('button')
    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('применяет variant стили', () => {
    const { container } = render(<Button variant="destructive">Удалить</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('применяет size стили', () => {
    const { container } = render(<Button size="lg">Большая кнопка</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-10')
  })

  it('передает дополнительные props', () => {
    render(
      <Button data-testid="custom-button" aria-label="Кастомная кнопка">
        Кнопка
      </Button>
    )

    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Кастомная кнопка')
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <Button className="custom-class">Кнопка</Button>
    )
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })
})
