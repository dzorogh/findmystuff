import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditContainerForm from '@/components/forms/edit-container-form'
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
jest.mock('@/hooks/use-container-marking', () => ({
  useContainerMarking: () => ({
    generateMarking: jest.fn(() => 'КОР-001'),
  }),
}))
jest.mock('@/contexts/settings-context', () => ({
  useSettings: () => ({
    isLoading: false,
    error: null,
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('EditContainerForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiClient.getContainer as jest.Mock).mockResolvedValue({
      data: {
        container: { id: 1, name: 'Старое название', photo_url: null, entity_type_id: 1 },
      },
    })
  })

  it('не отображается, когда open = false', () => {
    render(
      <EditContainerForm
        containerId={1}
        containerName="Контейнер"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.queryByText(/редактировать контейнер/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <EditContainerForm
        containerId={1}
        containerName="Контейнер"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('обновляет контейнер при валидных данных', async () => {
    const user = userEvent.setup({ delay: null })
    const mockUpdateContainer = jest.fn().mockResolvedValue({ data: { id: 1 } })
    ;(apiClient.updateContainer as jest.Mock).mockImplementation(mockUpdateContainer)

    render(
      <EditContainerForm
        containerId={1}
        containerName="Старое название"
        containerTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название контейнера/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Новое название')

    const submitButton = screen.getByRole('button', { name: /сохранить/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateContainer).toHaveBeenCalledWith(1, expect.objectContaining({
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
    const mockUpdateContainer = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка обновления' })
    ;(apiClient.updateContainer as jest.Mock) = mockUpdateContainer

    render(
      <EditContainerForm
        containerId={1}
        containerName="Контейнер"
        containerTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const nameInput = screen.getByLabelText(/название контейнера/i)
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
      <EditContainerForm
        containerId={1}
        containerName="Контейнер"
        containerTypeId={1}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/редактировать контейнер/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
