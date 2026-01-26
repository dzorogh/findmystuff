import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListActions } from '@/components/common/list-actions'

describe('ListActions', () => {
  const mockOnEdit = jest.fn()
  const mockOnMove = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnRestore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает кнопки для не удаленных сущностей', () => {
    render(
      <ListActions
        isDeleted={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTitle('Редактировать')).toBeInTheDocument()
    expect(screen.getByTitle('Переместить')).toBeInTheDocument()
    expect(screen.getByTitle('Удалить')).toBeInTheDocument()
  })

  it('отображает кнопку восстановления для удаленных сущностей', () => {
    render(
      <ListActions
        isDeleted={true}
        onRestore={mockOnRestore}
      />
    )

    expect(screen.getByTitle('Восстановить')).toBeInTheDocument()
    expect(screen.queryByTitle('Редактировать')).not.toBeInTheDocument()
  })

  it('вызывает onEdit при клике', async () => {
    const user = userEvent.setup()
    render(
      <ListActions
        isDeleted={false}
        onEdit={mockOnEdit}
      />
    )

    await user.click(screen.getByTitle('Редактировать'))
    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it('отключает кнопки, когда disabled = true', () => {
    render(
      <ListActions
        isDeleted={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        disabled={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('не отображает кнопки, если handlers не переданы', () => {
    render(<ListActions isDeleted={false} />)
    expect(screen.queryByTitle('Редактировать')).not.toBeInTheDocument()
  })
})
