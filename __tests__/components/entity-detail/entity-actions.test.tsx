import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntityActions } from '@/components/entity-detail/entity-actions'

describe('EntityActions', () => {
  const mockOnEdit = jest.fn()
  const mockOnMove = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnRestore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает кнопки действий', () => {
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    expect(screen.getByText(/редактировать/i)).toBeInTheDocument()
    expect(screen.getByText(/переместить/i)).toBeInTheDocument()
    expect(screen.getByText(/удалить/i)).toBeInTheDocument()
  })

  it('отображает кнопку восстановления для удаленных сущностей', () => {
    render(
      <EntityActions
        isDeleted={true}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    expect(screen.getByText(/восстановить/i)).toBeInTheDocument()
    expect(screen.queryByText(/удалить/i)).not.toBeInTheDocument()
  })

  it('вызывает onEdit при клике на редактировать', async () => {
    const user = userEvent.setup()
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    await user.click(screen.getByText(/редактировать/i))
    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it('вызывает onMove при клике на переместить', async () => {
    const user = userEvent.setup()
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    await user.click(screen.getByText(/переместить/i))
    expect(mockOnMove).toHaveBeenCalledTimes(1)
  })

  it('вызывает onDelete при клике на удалить', async () => {
    const user = userEvent.setup()
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    await user.click(screen.getByText(/удалить/i))
    expect(mockOnDelete).toHaveBeenCalledTimes(1)
  })

  it('вызывает onRestore при клике на восстановить', async () => {
    const user = userEvent.setup()
    render(
      <EntityActions
        isDeleted={true}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    await user.click(screen.getByText(/восстановить/i))
    expect(mockOnRestore).toHaveBeenCalledTimes(1)
  })

  it('отключает кнопки во время удаления', () => {
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={true}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('скрывает кнопку перемещения, если showMove = false', () => {
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onMove={mockOnMove}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
        showMove={false}
      />
    )

    expect(screen.queryByText(/переместить/i)).not.toBeInTheDocument()
  })

  it('не отображает кнопку перемещения, если onMove не передан', () => {
    render(
      <EntityActions
        isDeleted={false}
        isDeleting={false}
        isRestoring={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onRestore={mockOnRestore}
      />
    )

    expect(screen.queryByText(/переместить/i)).not.toBeInTheDocument()
  })
})
