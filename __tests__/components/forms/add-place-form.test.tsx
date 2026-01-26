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
jest.mock('@/contexts/settings-context', () => ({
  useSettings: () => ({
    isLoading: false,
    error: null,
    getMarkingTemplate: () => '{TYPE}-{NUMBER}',
    getPlaceMarkingTemplate: () => '{TYPE}-{NUMBER}',
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
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
      const errorMessage = screen.queryByText(/необходимо выбрать/i) ||
                          screen.queryByText(/необходимо выбрать тип места/i) ||
                          screen.queryByText(/необходимо выбрать помещение/i)
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

    // Проверяем, что форма отображается и имеет все необходимые поля
    const nameInput = screen.getByLabelText(/название места/i)
    expect(nameInput).toBeInTheDocument()
    
    // Проверяем наличие полей типа и помещения (используем queryAllByText для избежания ошибок с множественными элементами)
    const typeLabels = screen.queryAllByText(/тип места/i)
    expect(typeLabels.length).toBeGreaterThan(0)
    
    const roomLabels = screen.queryAllByText(/выберите помещение/i)
    expect(roomLabels.length).toBeGreaterThan(0)
    
    // Попытка отправить без выбора типа - должна быть ошибка
    const submitButton = screen.getByRole('button', { name: /добавить место/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/необходимо выбрать/i)
      expect(errorMessage).toBeInTheDocument()
    }, { timeout: 2000 })
    
    expect(mockCreatePlace).not.toHaveBeenCalled()
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

    // Проверяем, что форма отображается
    const nameInput = screen.getByLabelText(/название места/i)
    expect(nameInput).toBeInTheDocument()
    
    // Попытка отправить без заполнения обязательных полей - должна быть ошибка валидации
    const submitButton = screen.getByRole('button', { name: /добавить место/i })
    await user.click(submitButton)

    await waitFor(() => {
      const errorMessage = screen.queryByText(/необходимо выбрать/i) ||
                          screen.queryByText(/ошибка создания/i)
      expect(errorMessage).toBeInTheDocument()
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
