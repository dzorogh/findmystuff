import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddRoomForm from '@/components/forms/add-room-form'
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
jest.mock('@/contexts/settings-context', () => ({
  useSettings: () => ({
    isLoading: false,
    error: null,
    getMarkingTemplate: () => '{TYPE}-{NUMBER}',
    getPlaceMarkingTemplate: () => '{TYPE}-{NUMBER}',
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('AddRoomForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(<AddRoomForm open={false} onOpenChange={mockOnOpenChange} />)
    expect(screen.queryByText(/добавить новое помещение/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(<AddRoomForm open={true} onOpenChange={mockOnOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByText(/добавить новое помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('создает помещение при валидных данных', async () => {
    const user = userEvent.setup()
    const mockCreateRoom = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.createRoom as jest.Mock) = mockCreateRoom

    render(
      <AddRoomForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/добавить новое помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название/i)
    await user.type(nameInput, 'Новое помещение')

    const submitButton = screen.getByRole('button', { name: /добавить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Новое помещение',
        })
      )
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('обрабатывает ошибку создания', async () => {
    const user = userEvent.setup()
    const mockCreateRoom = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка создания' })
    ;(apiClient.createRoom as jest.Mock) = mockCreateRoom

    render(<AddRoomForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новое помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название/i)
    await user.type(nameInput, 'Помещение с ошибкой')

    const submitButton = screen.getByRole('button', { name: /добавить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/ошибка создания/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(<AddRoomForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить новое помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
