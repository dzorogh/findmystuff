import { render, screen } from '@testing-library/react'
import { Divider } from '@/components/ui/divider'

describe('Divider', () => {
  it('отображает дефолтный текст "или"', () => {
    render(<Divider />)
    expect(screen.getByText('или')).toBeInTheDocument()
  })

  it('отображает кастомный текст', () => {
    render(<Divider text="или же" />)
    expect(screen.getByText('или же')).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Divider className="custom-divider" />)
    const divider = container.querySelector('.custom-divider')
    expect(divider).toBeInTheDocument()
  })
})
