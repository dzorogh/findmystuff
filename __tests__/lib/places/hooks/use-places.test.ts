import { renderHook, waitFor } from '@testing-library/react'
import { usePlaces } from '@/lib/places/hooks/use-places'
import { getPlacesSimple } from '@/lib/places/api'

jest.mock('@/lib/places/api')

describe('usePlaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает места и возвращает их', async () => {
    const mockPlaces = [{ id: 1, name: 'Shelf' }]
    ;(getPlacesSimple as jest.Mock).mockResolvedValue({
      data: mockPlaces,
    })

    const { result } = renderHook(() => usePlaces(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.places).toEqual(mockPlaces)
    expect(result.current.error).toBeNull()
    expect(getPlacesSimple).toHaveBeenCalledWith(false)
  })

  it('передаёт includeDeleted в getPlacesSimple', async () => {
    ;(getPlacesSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => usePlaces(true))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getPlacesSimple).toHaveBeenCalledWith(true)
  })

  it('устанавливает error при ошибке API', async () => {
    ;(getPlacesSimple as jest.Mock).mockResolvedValue({
      error: 'Ошибка загрузки',
    })

    const { result } = renderHook(() => usePlaces(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.places).toEqual([])
  })

  it('refetch вызывает loadPlaces снова', async () => {
    ;(getPlacesSimple as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => usePlaces(false))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getPlacesSimple).toHaveBeenCalledTimes(1)

    await result.current.refetch()

    await waitFor(() => {
      expect(getPlacesSimple).toHaveBeenCalledTimes(2)
    })
  })
})
