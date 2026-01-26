import { renderHook, waitFor } from '@testing-library/react'
import { useContainers } from '@/hooks/use-containers'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client')

describe('useContainers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает контейнеры при монтировании', async () => {
    const mockContainers = [
      { id: 1, name: 'Контейнер 1' },
      { id: 2, name: 'Контейнер 2' },
    ]

    ;(apiClient.getContainersSimple as jest.Mock).mockResolvedValue({
      data: mockContainers,
    })

    const { result } = renderHook(() => useContainers(false))

    await waitFor(() => {
      expect(result.current.containers).toEqual(mockContainers)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('обрабатывает ошибку загрузки', async () => {
    const errorMessage = 'Ошибка загрузки контейнеров'
    ;(apiClient.getContainersSimple as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => useContainers(false))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.containers).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('загружает контейнеры с учетом includeDeleted', async () => {
    ;(apiClient.getContainersSimple as jest.Mock).mockResolvedValue({
      data: [],
    })

    const { result, rerender } = renderHook(
      ({ includeDeleted }) => useContainers(includeDeleted),
      { initialProps: { includeDeleted: false } }
    )

    await waitFor(() => {
      expect(apiClient.getContainersSimple).toHaveBeenCalledWith(false)
    })

    rerender({ includeDeleted: true })

    await waitFor(() => {
      expect(apiClient.getContainersSimple).toHaveBeenCalledWith(true)
    })
  })

  it('предоставляет функцию refetch', async () => {
    const mockContainers = [{ id: 1, name: 'Контейнер 1' }]
    ;(apiClient.getContainersSimple as jest.Mock).mockResolvedValue({
      data: mockContainers,
    })

    const { result } = renderHook(() => useContainers(false))

    await waitFor(() => {
      expect(result.current.containers).toEqual(mockContainers)
    })

    const callCount = (apiClient.getContainersSimple as jest.Mock).mock.calls.length

    result.current.refetch()

    await waitFor(() => {
      expect((apiClient.getContainersSimple as jest.Mock).mock.calls.length).toBe(
        callCount + 1
      )
    })
  })

  it('показывает состояние загрузки', () => {
    ;(apiClient.getContainers as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Никогда не резолвится
    )

    const { result } = renderHook(() => useContainers({ includeDeleted: false }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.containers).toEqual([])
  })
})
