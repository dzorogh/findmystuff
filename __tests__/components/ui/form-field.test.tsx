import { render, screen } from '@testing-library/react'
import { FormField } from '@/components/ui/form-field'

describe('FormField', () => {
  it('рендерится с children', () => {
    render(
      <FormField>
        <input type="text" />
      </FormField>
    )
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('отображает label', () => {
    render(
      <FormField label="Название поля">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Название поля')).toBeInTheDocument()
  })

  it('связывает label с input через htmlFor', () => {
    render(
      <FormField label="Поле" htmlFor="test-input">
        <input id="test-input" type="text" />
      </FormField>
    )
    const label = screen.getByText('Поле')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('отображает описание', () => {
    render(
      <FormField label="Поле" description="Описание поля">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Описание поля')).toBeInTheDocument()
  })

  it('отображает ошибку', () => {
    render(
      <FormField label="Поле" error="Ошибка валидации">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Ошибка валидации')).toBeInTheDocument()
    expect(screen.queryByText(/описание/i)).not.toBeInTheDocument()
  })

  it('отображает звездочку для обязательных полей', () => {
    render(
      <FormField label="Поле" required>
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
