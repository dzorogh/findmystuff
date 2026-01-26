import { render, screen } from '@testing-library/react'
import { ErrorCard } from '@/components/common/error-card'

describe('ErrorCard', () => {
  it('отображает сообщение об ошибке', () => {
    render(<ErrorCard message="Произошла ошибка" />)
    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
  })

  it('не отображается, если message пустой', () => {
    const { container } = render(<ErrorCard message="" />)
    expect(container.firstChild).toBeNull()
  })

  it('не отображается, если message не передан', () => {
    const { container } = render(<ErrorCard message={undefined as any} />)
    expect(container.firstChild).toBeNull()
  })

  it('применяет стили для ошибки', () => {
    const { container } = render(<ErrorCard message="Ошибка" />)
    const card = container.querySelector('.border-destructive')
    expect(card).toBeInTheDocument()
  })
})
