import { renderHook, waitFor } from '@testing-library/react'
import { useContainers } from '@/lib/containers/hooks/use-containers'
import { getContainersSimple } from '@/lib/containers/api'

jest.mock('@/lib/containers/api')

describe('useContainers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает контейнеры и возвращает их', async () => {
    const mockContainers = [{ id: 1, name: 'Box' }]
    ;(getContainersSimple as jest.Mock).mockResolvedValue({
      data: mockContainers,
    })

    const { result } = renderHook(() => useContainers(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.containers).toEqual(mockContainers)
    expect(result.current.error).toBeNull()
    expect(getContainersSimple).toHaveBeenCalledWith(false)
  })

  it('передаёт includeDeleted в getContainersSimple', async () => {
    ;(getContainersSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useContainers(true))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getContainersSimple).toHaveBeenCalledWith(true)
  })

  it('устанавливает error при ошибке API', async () => {
    ;(getContainersSimple as jest.Mock).mockResolvedValue({
      error: 'Ошибка загрузки',
    })

    const { result } = renderHook(() => useContainers(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.containers).toEqual([])
  })

  it('refetch вызывает loadContainers снова', async () => {
    ;(getContainersSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useContainers(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getContainersSimple).toHaveBeenCalledTimes(1)

    await result.current.refetch()

    await waitFor(() => {
      expect(getContainersSimple).toHaveBeenCalledTimes(2)
    })
  })
})
