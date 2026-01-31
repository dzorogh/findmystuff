import { renderHook, waitFor, act } from '@testing-library/react'
import { useContainers } from '@/lib/containers/hooks/use-containers'
import * as containersApi from '@/lib/containers/api'

jest.mock('@/lib/containers/api')

describe('useContainers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает контейнеры при монтировании', async () => {
    const mockContainers = [
      { id: 1, name: 'Контейнер 1' },
      { id: 2, name: 'Контейнер 2' },
    ]
    ;(containersApi.getContainersSimple as jest.Mock).mockResolvedValue({
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
    ;(containersApi.getContainersSimple as jest.Mock).mockRejectedValue(
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
    ;(containersApi.getContainersSimple as jest.Mock).mockResolvedValue({
      data: [],
    })
    const { result, rerender } = renderHook(
      ({ includeDeleted }) => useContainers(includeDeleted),
      { initialProps: { includeDeleted: false } }
    )
    await waitFor(() => {
      expect(containersApi.getContainersSimple).toHaveBeenCalledWith(false)
    })
    rerender({ includeDeleted: true })
    await waitFor(() => {
      expect(containersApi.getContainersSimple).toHaveBeenCalledWith(true)
    })
  })

  it('предоставляет функцию refetch', async () => {
    const mockContainers = [{ id: 1, name: 'Контейнер 1' }]
    ;(containersApi.getContainersSimple as jest.Mock).mockResolvedValue({
      data: mockContainers,
    })
    const { result } = renderHook(() => useContainers(false))
    await waitFor(() => {
      expect(result.current.containers).toEqual(mockContainers)
    })
    const callCount = (containersApi.getContainersSimple as jest.Mock).mock.calls.length
    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => {
      expect((containersApi.getContainersSimple as jest.Mock).mock.calls.length).toBe(
        callCount + 1
      )
    })
  })

  it('показывает состояние загрузки', () => {
    ;(containersApi.getContainersSimple as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )
    const { result } = renderHook(() => useContainers(false))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.containers).toEqual([])
  })
})
