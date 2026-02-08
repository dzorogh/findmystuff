import { renderHook, waitFor } from '@testing-library/react'
import { useRooms } from '@/lib/rooms/hooks/use-rooms'
import { getRoomsSimple } from '@/lib/rooms/api'

jest.mock('@/lib/rooms/api')

describe('useRooms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает помещения и возвращает их', async () => {
    const mockRooms = [{ id: 1, name: 'Room A' }]
    ;(getRoomsSimple as jest.Mock).mockResolvedValue({
      data: mockRooms,
    })

    const { result } = renderHook(() => useRooms(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.rooms).toEqual(mockRooms)
    expect(result.current.error).toBeNull()
    expect(getRoomsSimple).toHaveBeenCalledWith(false)
  })

  it('передаёт includeDeleted в getRoomsSimple', async () => {
    ;(getRoomsSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useRooms(true))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getRoomsSimple).toHaveBeenCalledWith(true)
  })

  it('устанавливает error при ошибке API', async () => {
    ;(getRoomsSimple as jest.Mock).mockResolvedValue({
      error: 'Ошибка загрузки',
    })

    const { result } = renderHook(() => useRooms(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.rooms).toEqual([])
  })

  it('refetch вызывает loadRooms снова', async () => {
    ;(getRoomsSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useRooms(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getRoomsSimple).toHaveBeenCalledTimes(1)

    await result.current.refetch()

    await waitFor(() => {
      expect(getRoomsSimple).toHaveBeenCalledTimes(2)
    })
  })
})
