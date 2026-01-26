import { render, screen } from '@testing-library/react'
import { FormGroup } from '@/components/ui/form-group'

describe('FormGroup', () => {
  it('рендерится с children', () => {
    render(
      <FormGroup>
        <input type="text" />
        <input type="text" />
      </FormGroup>
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <FormGroup className="custom-group">
        <div>Тест</div>
      </FormGroup>
    )
    const group = container.querySelector('.custom-group')
    expect(group).toBeInTheDocument()
  })

  it('применяет separator стили', () => {
    const { container } = render(
      <FormGroup separator>
        <div>Тест</div>
      </FormGroup>
    )
    const group = container.querySelector('.border-t')
    expect(group).toBeInTheDocument()
  })
})
