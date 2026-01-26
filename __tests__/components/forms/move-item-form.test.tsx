import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MoveItemForm from '@/components/forms/move-item-form'
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
jest.mock('@/hooks/use-rooms', () => ({
  useRooms: () => ({
    rooms: [{ id: 1, name: 'Комната 1' }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))
jest.mock('@/hooks/use-places', () => ({
  usePlaces: () => ({
    places: [{ id: 1, name: 'Место 1' }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))
jest.mock('@/hooks/use-containers', () => ({
  useContainers: () => ({
    containers: [{ id: 1, name: 'Контейнер 1' }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))
jest.mock('@/components/common/qr-scanner', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/contexts/settings-context', () => ({
  useSettings: () => ({
    isLoading: false,
    error: null,
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('MoveItemForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.queryByText(/переместить вещь/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/переместить вещь/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('валидирует обязательное поле назначения', async () => {
    const user = userEvent.setup()
    const mockCreateTransition = jest.fn()
    ;(apiClient.createTransition as jest.Mock) = mockCreateTransition

    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/переместить вещь/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Попытка отправить форму без выбора назначения
    const submitButton = screen.getByRole('button', { name: /переместить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/выберите место назначения/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(mockCreateTransition).not.toHaveBeenCalled()
  })

  it('перемещает вещь при валидных данных', async () => {
    const user = userEvent.setup()
    const mockCreateTransition = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.createTransition as jest.Mock) = mockCreateTransition

    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/переместить вещь/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Выбираем помещение
    const locationCombobox = screen.getByLabelText(/выберите/i)
    await user.click(locationCombobox)
    await waitFor(async () => {
      const roomOption = screen.getByText(/Комната 1/i)
      await user.click(roomOption)
    }, { timeout: 2000 })

    const submitButton = screen.getByRole('button', { name: /переместить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateTransition).toHaveBeenCalledWith({
        item_id: 1,
        destination_type: 'room',
        destination_id: 1,
      })
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('обрабатывает ошибку перемещения', async () => {
    const user = userEvent.setup()
    const mockCreateTransition = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка перемещения' })
    ;(apiClient.createTransition as jest.Mock) = mockCreateTransition

    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/переместить вещь/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Выбираем помещение
    const locationCombobox = screen.getByLabelText(/выберите/i)
    await user.click(locationCombobox)
    await waitFor(async () => {
      const roomOption = screen.getByText(/Комната 1/i)
      await user.click(roomOption)
    }, { timeout: 2000 })

    const submitButton = screen.getByRole('button', { name: /переместить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/ошибка перемещения/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(
      <MoveItemForm
        itemId={1}
        itemName="Вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/переместить вещь/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
