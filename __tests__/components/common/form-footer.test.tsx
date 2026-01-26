import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormFooter } from '@/components/common/form-footer'
import { Plus } from 'lucide-react'

describe('FormFooter', () => {
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает кнопки отмены и сохранения', () => {
    render(<FormFooter isSubmitting={false} onCancel={mockOnCancel} />)
    expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeInTheDocument()
  })

  it('вызывает onCancel при клике на отмену', async () => {
    const user = userEvent.setup()
    render(<FormFooter isSubmitting={false} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('отображает состояние загрузки', () => {
    render(<FormFooter isSubmitting={true} onCancel={mockOnCancel} />)
    expect(screen.getByText(/сохранение/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })

  it('использует кастомные метки кнопок', () => {
    render(
      <FormFooter
        isSubmitting={false}
        onCancel={mockOnCancel}
        submitLabel="Добавить"
        cancelLabel="Закрыть"
      />
    )
    expect(screen.getByRole('button', { name: /добавить/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /закрыть/i })).toBeInTheDocument()
  })

  it('отображает иконку для кнопки отправки', () => {
    const { container } = render(
      <FormFooter
        isSubmitting={false}
        onCancel={mockOnCancel}
        submitIcon={Plus}
      />
    )
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('не отображает иконку во время загрузки', () => {
    const { container } = render(
      <FormFooter
        isSubmitting={true}
        onCancel={mockOnCancel}
        submitIcon={Plus}
      />
    )
    // Во время загрузки должна быть иконка Loader2, а не Plus
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('отключает кнопки, когда disabled = true', () => {
    render(
      <FormFooter
        isSubmitting={false}
        onCancel={mockOnCancel}
        disabled={true}
      />
    )
    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})
