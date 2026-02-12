import { renderHook, waitFor } from '@testing-library/react'
import { useEntityDataLoader } from '@/lib/entities/hooks/use-entity-data-loader'

describe('useEntityDataLoader', () => {
  it('вызывает loadData при монтировании', async () => {
    const loadData = jest.fn().mockResolvedValue(undefined)

    renderHook(() =>
      useEntityDataLoader({
        entityId: 1,
        loadData,
      })
    )

    await waitFor(() => {
      expect(loadData).toHaveBeenCalled()
    })
  })

  it('вызывает loadData при смене entityId', async () => {
    const loadData = jest.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ entityId }) =>
        useEntityDataLoader({
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

  it('не падает при размонтировании до завершения loadData', async () => {
    const loadData = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { unmount } = renderHook(() =>
      useEntityDataLoader({
        entityId: 1,
        loadData,
      })
    )

    await waitFor(() => expect(loadData).toHaveBeenCalled())
    unmount()
    await new Promise((r) => setTimeout(r, 150))
  })
})
