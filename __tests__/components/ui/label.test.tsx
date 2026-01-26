import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('рендерится с текстом', () => {
    render(<Label>Название поля</Label>)
    expect(screen.getByText('Название поля')).toBeInTheDocument()
  })

  it('связывается с input через htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Тестовое поле</Label>
        <input id="test-input" />
      </>
    )

    const label = screen.getByText('Тестовое поле')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <Label className="custom-label">Тест</Label>
    )
    const label = container.querySelector('.custom-label')
    expect(label).toBeInTheDocument()
  })
})
