import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditRoomForm from '@/components/forms/edit-room-form'
import * as roomsApi from '@/lib/rooms/api'
import { toast } from 'sonner'

jest.mock('@/lib/rooms/api')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('@/lib/users/context', () => ({
  useUser: () => ({ user: { id: '1' }, isLoading: false }),
}))
jest.mock('@/lib/settings/context', () => ({
  useSettings: () => ({
    isLoading: false,
    error: null,
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('EditRoomForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(roomsApi.getRoom as jest.Mock).mockResolvedValue({
      data: {
        room: { id: 1, name: 'Старое название', photo_url: null },
      },
    })
  })

  it('не отображается, когда open = false', () => {
    render(
      <EditRoomForm
        roomId={1}
        roomName="Комната"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.queryByText(/редактировать помещение/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <EditRoomForm
        roomId={1}
        roomName="Комната"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('обновляет помещение при валидных данных', async () => {
    const user = userEvent.setup({ delay: null })
    const mockUpdateRoom = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(roomsApi.updateRoom as jest.Mock).mockImplementation(mockUpdateRoom)

    render(
      <EditRoomForm
        roomId={1}
        roomName="Старое название"
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(roomsApi.getRoom).toHaveBeenCalledWith(1)
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название/i)
    await act(async () => {
      await user.clear(nameInput)
      await user.type(nameInput, 'Новое название')
    })

    const submitButton = screen.getByRole('button', { name: /сохранить/i })
    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(
      () => {
        expect(mockUpdateRoom).toHaveBeenCalledWith(1, expect.objectContaining({
          name: 'Новое название',
        }))
      },
      { timeout: 5000 }
    )

    await new Promise((resolve) => setTimeout(resolve, 500))

    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      },
      { timeout: 3000 }
    )
  }, 15000)

  it('обрабатывает ошибку обновления', async () => {
    const user = userEvent.setup({ delay: null })
    const mockUpdateRoom = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка обновления' })
    ;(roomsApi.updateRoom as jest.Mock).mockImplementation(mockUpdateRoom)

    render(
      <EditRoomForm
        roomId={1}
        roomName="Комната"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название/i)
    await user.type(nameInput, 'Новое название')

    const submitButton = screen.getByRole('button', { name: /сохранить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/ошибка обновления/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(
      <EditRoomForm
        roomId={1}
        roomName="Комната"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать помещение/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
