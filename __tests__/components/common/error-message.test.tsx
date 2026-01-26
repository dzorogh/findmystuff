import { render, screen } from '@testing-library/react'
import { ErrorMessage } from '@/components/common/error-message'

describe('ErrorMessage', () => {
  it('отображает сообщение об ошибке', () => {
    render(<ErrorMessage message="Произошла ошибка" />)
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
  })

  it('не отображается, если message пустой', () => {
    const { container } = render(<ErrorMessage message="" />)
    expect(container.firstChild).toBeNull()
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <ErrorMessage message="Ошибка" className="custom-class" />
    )
    const errorDiv = container.querySelector('.custom-class')
    expect(errorDiv).toBeInTheDocument()
  })

  it('применяет стили для ошибки', () => {
    const { container } = render(<ErrorMessage message="Ошибка" />)
    const errorDiv = container.querySelector('.bg-destructive\\/10')
    expect(errorDiv).toBeTruthy()
  })
})
