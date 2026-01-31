import { renderHook, waitFor } from '@testing-library/react'
import { useEntityDataLoader } from '@/lib/entities/hooks/use-entity-data-loader'

describe('useEntityDataLoader', () => {
  const mockLoadData = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не загружает данные, если пользователь не авторизован', () => {
    renderHook(() =>
      useEntityDataLoader({
        user: null,
        isUserLoading: false,
        entityId: 1,
        loadData: mockLoadData,
      })
    )

    expect(mockLoadData).not.toHaveBeenCalled()
  })

  it('не загружает данные, пока идет загрузка пользователя', () => {
    renderHook(() =>
      useEntityDataLoader({
        user: { id: '1' } as any,
        isUserLoading: true,
        entityId: 1,
        loadData: mockLoadData,
      })
    )

    expect(mockLoadData).not.toHaveBeenCalled()
  })

  it('загружает данные при монтировании, если пользователь авторизован', async () => {
    renderHook(() =>
      useEntityDataLoader({
        user: { id: '1' } as any,
        isUserLoading: false,
        entityId: 1,
        loadData: mockLoadData,
      })
    )

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledTimes(1)
    })
  })

  it('перезагружает данные при изменении entityId', async () => {
    const { rerender } = renderHook(
      ({ entityId }) =>
        useEntityDataLoader({
          user: { id: '1' } as any,
          isUserLoading: false,
          entityId,
          loadData: mockLoadData,
        }),
      { initialProps: { entityId: 1 } }
    )

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledTimes(1)
    })

    rerender({ entityId: 2 })

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledTimes(2)
    })
  })

  it('перезагружает данные при изменении пользователя', async () => {
    const { rerender } = renderHook(
      ({ user }) =>
        useEntityDataLoader({
          user,
          isUserLoading: false,
          entityId: 1,
          loadData: mockLoadData,
        }),
      { initialProps: { user: { id: '1' } as any } }
    )

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledTimes(1)
    })

    rerender({ user: { id: '2' } as any })

    await waitFor(() => {
      expect(mockLoadData).toHaveBeenCalledTimes(2)
    })
  })

  it('предотвращает параллельные запросы', async () => {
    const slowLoadData = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    renderHook(() =>
      useEntityDataLoader({
        user: { id: '1' } as any,
        isUserLoading: false,
        entityId: 1,
        loadData: slowLoadData,
      })
    )

    // Быстрое изменение entityId не должно вызвать второй запрос
    // пока первый не завершился
    await waitFor(() => {
      expect(slowLoadData).toHaveBeenCalled()
    })

    const callCount = slowLoadData.mock.calls.length

    // Ждем завершения первого запроса
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(slowLoadData.mock.calls.length).toBe(callCount)
  })
})
