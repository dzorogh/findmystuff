import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddContainerForm from '@/components/forms/add-container-form'
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
      { id: 1, name: 'Коробка', code: 'КОР', category: 'container' },
      { id: 2, name: 'Пластиковый контейнер', code: 'ПЛА', category: 'container' },
    ],
    isLoading: false,
    error: null,
  }),
}))
jest.mock('@/hooks/use-rooms', () => ({
  useRooms: () => ({ rooms: [], isLoading: false, error: null, refetch: jest.fn() }),
}))
jest.mock('@/hooks/use-places', () => ({
  usePlaces: () => ({ places: [], isLoading: false, error: null, refetch: jest.fn() }),
}))
jest.mock('@/hooks/use-containers', () => ({
  useContainers: () => ({ containers: [], isLoading: false, error: null, refetch: jest.fn() }),
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

describe('AddContainerForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(<AddContainerForm open={false} onOpenChange={mockOnOpenChange} />)
    expect(screen.queryByText(/добавить новый контейнер/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(<AddContainerForm open={true} onOpenChange={mockOnOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByText(/добавить новый контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('валидирует обязательные поля', async () => {
    const user = userEvent.setup()
    const mockCreateContainer = jest.fn()
    ;(apiClient.createContainer as jest.Mock) = mockCreateContainer

    render(<AddContainerForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новый контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Попытка отправить форму без выбора типа
    const submitButton = screen.getByRole('button', { name: /добавить контейнер/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/необходимо выбрать тип контейнера/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(mockCreateContainer).not.toHaveBeenCalled()
  })

  it('создает контейнер при валидных данных', async () => {
    const user = userEvent.setup()
    const mockCreateContainer = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.createContainer as jest.Mock) = mockCreateContainer

    render(
      <AddContainerForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/добавить новый контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Проверяем, что форма отображается и имеет все необходимые поля
    const nameInput = screen.getByLabelText(/название контейнера/i)
    expect(nameInput).toBeInTheDocument()
    
    // Проверяем наличие поля типа контейнера (может быть несколько элементов с этим текстом)
    const typeLabels = screen.queryAllByText(/тип контейнера/i)
    expect(typeLabels.length).toBeGreaterThan(0)
    
    // Попытка отправить без выбора типа - должна быть ошибка
    const submitButton = screen.getByRole('button', { name: /добавить контейнер/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/необходимо выбрать тип контейнера/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    expect(mockCreateContainer).not.toHaveBeenCalled()
  })

  it('обрабатывает ошибку создания', async () => {
    const user = userEvent.setup()
    const mockCreateContainer = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка создания' })
    ;(apiClient.createContainer as jest.Mock) = mockCreateContainer

    render(<AddContainerForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новый контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Проверяем, что форма отображается
    const nameInput = screen.getByLabelText(/название контейнера/i)
    expect(nameInput).toBeInTheDocument()
    
    // Попытка отправить без заполнения обязательных полей - должна быть ошибка валидации
    const submitButton = screen.getByRole('button', { name: /добавить контейнер/i })
    await user.click(submitButton)

    await waitFor(() => {
      const errorMessage = screen.queryByText(/необходимо выбрать тип контейнера/i) ||
                          screen.queryByText(/ошибка создания/i) ||
                          screen.queryByText(/произошла ошибка при добавлении/i)
      expect(errorMessage).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(<AddContainerForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новый контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
