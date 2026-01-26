import { renderHook, waitFor } from '@testing-library/react'
import { useRooms } from '@/hooks/use-rooms'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client')

describe('useRooms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает помещения при монтировании', async () => {
    const mockRooms = [
      { id: 1, name: 'Комната 1' },
      { id: 2, name: 'Комната 2' },
    ]

    ;(apiClient.getRoomsSimple as jest.Mock).mockResolvedValue({
      data: mockRooms,
    })

    const { result } = renderHook(() => useRooms(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.rooms).toEqual(mockRooms)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('обрабатывает ошибку загрузки', async () => {
    const errorMessage = 'Ошибка загрузки помещений'
    ;(apiClient.getRoomsSimple as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => useRooms(false))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.rooms).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('загружает помещения с учетом includeDeleted', async () => {
    ;(apiClient.getRoomsSimple as jest.Mock).mockResolvedValue({
      data: [],
    })

    const { result, rerender } = renderHook(
      ({ includeDeleted }) => useRooms(includeDeleted),
      { initialProps: { includeDeleted: false } }
    )

    await waitFor(() => {
      expect(apiClient.getRoomsSimple).toHaveBeenCalledWith(false)
    })

    rerender({ includeDeleted: true })

    await waitFor(() => {
      expect(apiClient.getRoomsSimple).toHaveBeenCalledWith(true)
    })
  })

  it('предоставляет функцию refetch', async () => {
    const mockRooms = [{ id: 1, name: 'Комната 1' }]
    ;(apiClient.getRoomsSimple as jest.Mock).mockResolvedValue({
      data: mockRooms,
    })

    const { result } = renderHook(() => useRooms(false))

    await waitFor(() => {
      expect(result.current.rooms).toEqual(mockRooms)
    })

    const callCount = (apiClient.getRoomsSimple as jest.Mock).mock.calls.length

    result.current.refetch()

    await waitFor(() => {
      expect((apiClient.getRoomsSimple as jest.Mock).mock.calls.length).toBe(
        callCount + 1
      )
    })
  })
})
