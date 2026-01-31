import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditItemForm from '@/components/forms/edit-item-form'
import * as entitiesApi from '@/lib/entities/api'
import { toast } from 'sonner'

jest.mock('@/lib/entities/api')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('@/lib/users/context', () => ({
  useUser: () => ({ user: { id: '1' }, isLoading: false }),
}))

describe('EditItemForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.queryByText(/редактировать вещь/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', () => {
    render(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )
    expect(screen.getByText(/редактировать вещь/i)).toBeInTheDocument()
  })

  it('загружает текущее фото при открытии', async () => {
    const mockGetItem = jest.fn().mockResolvedValue({
      data: {
        item: {
          id: 1,
          name: 'Тестовая вещь',
          photo_url: 'https://example.com/photo.jpg',
        },
      },
    })
    ;(entitiesApi.getItem as jest.Mock).mockImplementation(mockGetItem)

    const { rerender } = render(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )

    rerender(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    await waitFor(
      () => {
        expect(mockGetItem).toHaveBeenCalledWith(1)
      },
      { timeout: 3000 }
    )
  })

  it(
    'обновляет вещь при валидных данных',
    async () => {
      const user = userEvent.setup({ delay: null })
      const mockUpdateItem = jest.fn().mockResolvedValue({ data: { id: 1 } })
;(entitiesApi.updateItem as jest.Mock).mockImplementation(mockUpdateItem)
    ;(entitiesApi.getItem as jest.Mock).mockResolvedValue({
        data: {
          item: { id: 1, name: 'Старое название', photo_url: null },
        },
      })

      render(
        <EditItemForm
          itemId={1}
          itemName="Старое название"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      )

      // Ждем загрузки фото
      await waitFor(
        () => {
          expect(entitiesApi.getItem).toHaveBeenCalledWith(1)
        },
        { timeout: 2000 }
      )

    const nameInput = screen.getByLabelText(/название вещи/i)
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
          expect(mockUpdateItem).toHaveBeenCalledWith(1, expect.objectContaining({
            name: 'Новое название',
          }))
        },
        { timeout: 3000 }
      )

      // Ждем завершения асинхронных операций
      await new Promise((resolve) => setTimeout(resolve, 500))

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith('Вещь успешно обновлена')
          expect(mockOnSuccess).toHaveBeenCalled()
          expect(mockOnOpenChange).toHaveBeenCalledWith(false)
        },
        { timeout: 3000 }
      )
    },
    10000
  )

  it('обрабатывает ошибку обновления', async () => {
    const user = userEvent.setup({ delay: null })
    const mockUpdateItem = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка обновления' })
    ;(entitiesApi.updateItem as jest.Mock).mockImplementation(mockUpdateItem)

    render(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const submitButton = screen.getByRole('button', { name: /сохранить/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/ошибка обновления/i)).toBeInTheDocument()
    })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <EditItemForm
        itemId={1}
        itemName="Тестовая вещь"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await user.click(cancelButton)

    await waitFor(
      () => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      },
      { timeout: 2000 }
    )
  })

  it('инициализирует форму с текущим названием', () => {
    render(
      <EditItemForm
        itemId={1}
        itemName="Текущее название"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const nameInput = screen.getByLabelText(/название вещи/i) as HTMLInputElement
    expect(nameInput.value).toBe('Текущее название')
  })
})
