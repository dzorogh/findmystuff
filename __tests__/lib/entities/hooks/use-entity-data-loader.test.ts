import { renderHook, waitFor } from '@testing-library/react'
import { useEntityDataLoader } from '@/lib/entities/hooks/use-entity-data-loader'
import type { User } from '@supabase/supabase-js'

describe('useEntityDataLoader', () => {
  const mockUser: User = { id: 'user-1' } as User

  it('вызывает loadData при наличии user и после загрузки', async () => {
    const loadData = jest.fn().mockResolvedValue(undefined)

    renderHook(() =>
      useEntityDataLoader({
        user: mockUser,
        isUserLoading: false,
        entityId: 1,
        loadData,
      })
    )

    await waitFor(() => {
      expect(loadData).toHaveBeenCalled()
    })
  })

  it('не вызывает loadData пока isUserLoading true', async () => {
    const loadData = jest.fn()

    renderHook(() =>
      useEntityDataLoader({
        user: mockUser,
        isUserLoading: true,
        entityId: 1,
        loadData,
      })
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(loadData).not.toHaveBeenCalled()
  })

  it('не вызывает loadData при отсутствии user', async () => {
    const loadData = jest.fn()

    renderHook(() =>
      useEntityDataLoader({
        user: null,
        isUserLoading: false,
        entityId: 1,
        loadData,
      })
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(loadData).not.toHaveBeenCalled()
  })

  it('вызывает loadData при смене entityId', async () => {
    const loadData = jest.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ entityId }) =>
        useEntityDataLoader({
          user: mockUser,
          isUserLoading: false,
          entityId,
          loadData,
        }),
      { initialProps: { entityId: 1 } }
    )

    await waitFor(() => {
      expect(loadData).toHaveBeenCalledTimes(1)
    })

    loadData.mockClear()
    rerender({ entityId: 2 })

    await waitFor(() => {
      expect(loadData).toHaveBeenCalled()
    })
  })
})
