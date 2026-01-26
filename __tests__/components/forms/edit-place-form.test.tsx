import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPlaceForm from '@/components/forms/edit-place-form'
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
jest.mock('@/hooks/use-place-marking', () => ({
  usePlaceMarking: () => ({
    generateMarking: jest.fn(() => 'ПОЛ-001'),
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

describe('EditPlaceForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.getPlace as jest.Mock).mockResolvedValue({
      data: {
        place: { id: 1, name: 'Старое название', photo_url: null, entity_type_id: 1 },
      },
    })
  })

  it('не отображается, когда open = false', () => {
    render(
      <EditPlaceForm
        placeId={1}
        placeName="Место"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.queryByText(/редактировать место/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <EditPlaceForm
        placeId={1}
        placeName="Место"
        placeTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать место/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('обновляет место при валидных данных', async () => {
    const user = userEvent.setup({ delay: null })
    const mockUpdatePlace = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.updatePlace as jest.Mock).mockImplementation(mockUpdatePlace)

    render(
      <EditPlaceForm
        placeId={1}
        placeName="Старое название"
        placeTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название места/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Новое название')

    const submitButton = screen.getByRole('button', { name: /сохранить/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdatePlace).toHaveBeenCalledWith(1, expect.objectContaining({
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
    const mockUpdatePlace = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка обновления' })
    ;(apiClient.updatePlace as jest.Mock) = mockUpdatePlace

    render(
      <EditPlaceForm
        placeId={1}
        placeName="Место"
        placeTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название места/i)
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
      <EditPlaceForm
        placeId={1}
        placeName="Место"
        placeTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать место/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
