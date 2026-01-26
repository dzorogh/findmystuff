import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddPlaceForm from '@/components/forms/add-place-form'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

jest.mock('@/lib/api-client')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('@/hooks/use-user', () => ({
  useUser: () => ({ user: { id: '1' }, isLoading: false }),
}))
jest.mock('@/hooks/use-entity-types', () => ({
  useEntityTypes: () => ({
    types: [
      { id: 1, name: 'Полка', code: 'ПОЛ', category: 'place' },
      { id: 2, name: 'Стол', code: 'СТОЛ', category: 'place' },
    ],
    isLoading: false,
    error: null,
  }),
}))
jest.mock('@/hooks/use-rooms', () => ({
  useRooms: () => ({
    rooms: [{ id: 1, name: 'Комната 1' }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))

describe('AddPlaceForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(<AddPlaceForm open={false} onOpenChange={mockOnOpenChange} />)
    expect(screen.queryByText(/добавить новое место/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(<AddPlaceForm open={true} onOpenChange={mockOnOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByText(/добавить новое место/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('валидирует обязательные поля', async () => {
    const user = userEvent.setup()
    const mockCreatePlace = jest.fn()
    ;(apiClient.createPlace as jest.Mock) = mockCreatePlace

    render(<AddPlaceForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новое место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Попытка отправить форму без выбора типа и помещения
    const submitButton = screen.getByRole('button', { name: /добавить место/i })
    await user.click(submitButton)

    await waitFor(() => {
      const errorMessage = screen.queryByText(/необходимо выбрать/i)
      expect(errorMessage).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(mockCreatePlace).not.toHaveBeenCalled()
  })

  it('создает место при валидных данных', async () => {
    const user = userEvent.setup()
    const mockCreatePlace = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.createPlace as jest.Mock) = mockCreatePlace

    render(
      <AddPlaceForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/добавить новое место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Выбираем тип места - ищем по label или placeholder
    const typeField = screen.getByLabelText(/тип места/i).closest('div')?.querySelector('input') || 
                     screen.getByPlaceholderText(/выберите тип места/i)
    await user.click(typeField)
    
    await waitFor(async () => {
      const option = screen.getByText(/ПОЛ - Полка/i)
      await user.click(option)
    }, { timeout: 2000 })

    // Выбираем помещение
    const roomCombobox = screen.getByLabelText(/выберите помещение/i)
    await user.click(roomCombobox)
    await waitFor(async () => {
      const roomOption = screen.getByText(/Комната 1/i)
      await user.click(roomOption)
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название места/i)
    await user.type(nameInput, 'Новое место')

    const submitButton = screen.getByRole('button', { name: /добавить место/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreatePlace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Новое место',
          entity_type_id: 1,
          destination_type: 'room',
        })
      )
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('обрабатывает ошибку создания', async () => {
    const user = userEvent.setup()
    const mockCreatePlace = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка создания' })
    ;(apiClient.createPlace as jest.Mock) = mockCreatePlace

    render(<AddPlaceForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новое место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Выбираем тип и помещение
    const typeField = screen.getByLabelText(/тип места/i).closest('div')?.querySelector('input') || 
                     screen.getByPlaceholderText(/выберите тип места/i)
    await user.click(typeField)
    
    await waitFor(async () => {
      const option = screen.getByText(/ПОЛ - Полка/i)
      await user.click(option)
    }, { timeout: 2000 })

    const roomCombobox = screen.getByLabelText(/выберите помещение/i)
    await user.click(roomCombobox)
    await waitFor(async () => {
      const roomOption = screen.getByText(/Комната 1/i)
      await user.click(roomOption)
    }, { timeout: 2000 })

    const submitButton = screen.getByRole('button', { name: /добавить место/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/ошибка создания/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(<AddPlaceForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новое место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
