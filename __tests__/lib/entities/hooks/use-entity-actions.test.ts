import { renderHook, waitFor, act } from '@testing-library/react'
import { useEntityActions } from '@/lib/entities/hooks/use-entity-actions'
import { softDeleteApiClient } from '@/lib/shared/api/soft-delete'
import { toast } from 'sonner'

jest.mock('@/lib/shared/api/soft-delete')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockConfirm = jest.fn()
window.confirm = mockConfirm

describe('useEntityActions', () => {
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('удаляет сущность при подтверждении', async () => {
    const mockSoftDelete = jest.fn().mockResolvedValue({ data: {} })
    ;(softDeleteApiClient.softDelete as jest.Mock) = mockSoftDelete

    const { result } = renderHook(() =>
      useEntityActions({
        entityType: 'items',
        entityId: 1,
        entityName: 'Вещь',
        onSuccess: mockOnSuccess,
      })
    )

    expect(result.current.isDeleting).toBe(false)

    await act(async () => {
      await result.current.handleDelete()
    })

    await waitFor(() => {
      expect(mockSoftDelete).toHaveBeenCalledWith('items', 1)
    })

    expect(toast.success).toHaveBeenCalledWith('Вещь успешно удален')
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(result.current.isDeleting).toBe(false)
  })

  it('не удаляет сущность при отмене', async () => {
    mockConfirm.mockReturnValue(false)
    const mockSoftDelete = jest.fn()
    ;(softDeleteApiClient.softDelete as jest.Mock) = mockSoftDelete

    const { result } = renderHook(() =>
      useEntityActions({
        entityType: 'items',
        entityId: 1,
        entityName: 'Вещь',
      })
    )

    await act(async () => {
      await result.current.handleDelete()
    })

    expect(mockSoftDelete).not.toHaveBeenCalled()
  })

  it('обрабатывает ошибку при удалении', async () => {
    const errorMessage = 'Ошибка удаления'
    ;(softDeleteApiClient.softDelete as jest.Mock).mockResolvedValue({ error: errorMessage })

    const { result } = renderHook(() =>
      useEntityActions({
        entityType: 'items',
        entityId: 1,
        entityName: 'Вещь',
      })
    )

    await act(async () => {
      await result.current.handleDelete()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Произошла ошибка при удалении Вещь')
    })

    expect(result.current.isDeleting).toBe(false)
  })

  it('восстанавливает удаленную сущность', async () => {
    const mockRestore = jest.fn().mockResolvedValue({ data: {} })
    ;(softDeleteApiClient.restoreDeleted as jest.Mock) = mockRestore

    const { result } = renderHook(() =>
      useEntityActions({
        entityType: 'items',
        entityId: 1,
        entityName: 'Вещь',
        onSuccess: mockOnSuccess,
      })
    )

    expect(result.current.isRestoring).toBe(false)

    await act(async () => {
      await result.current.handleRestore()
    })

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith('items', 1)
    })

    expect(toast.success).toHaveBeenCalledWith('Вещь успешно восстановлен')
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(result.current.isRestoring).toBe(false)
  })

  it('обрабатывает ошибку при восстановлении', async () => {
    ;(softDeleteApiClient.restoreDeleted as jest.Mock).mockResolvedValue({
      error: 'Ошибка восстановления',
    })

    const { result } = renderHook(() =>
      useEntityActions({
        entityType: 'items',
        entityId: 1,
        entityName: 'Вещь',
      })
    )

    await act(async () => {
      await result.current.handleRestore()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Произошла ошибка при восстановлении Вещь'
      )
    })

    expect(result.current.isRestoring).toBe(false)
  })

  it('работает с разными типами сущностей', async () => {
    const mockSoftDelete = jest.fn().mockResolvedValue({ data: {} })
    ;(softDeleteApiClient.softDelete as jest.Mock) = mockSoftDelete

    const types: Array<'containers' | 'items' | 'places' | 'rooms'> = [
      'containers',
      'items',
      'places',
      'rooms',
    ]

    for (const type of types) {
      const { result } = renderHook(() =>
        useEntityActions({
          entityType: type,
          entityId: 1,
          entityName: 'Сущность',
        })
      )

      await act(async () => {
        await result.current.handleDelete()
      })

      expect(mockSoftDelete).toHaveBeenCalledWith(type, 1)
      jest.clearAllMocks()
    }
  })
})
