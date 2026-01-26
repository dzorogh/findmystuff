import { renderHook, waitFor } from '@testing-library/react'
import { usePlaces } from '@/hooks/use-places'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client')

describe('usePlaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает места при монтировании', async () => {
    const mockPlaces = [
      { id: 1, name: 'Место 1' },
      { id: 2, name: 'Место 2' },
    ]

    ;(apiClient.getPlacesSimple as jest.Mock).mockResolvedValue({
      data: mockPlaces,
    })

    const { result } = renderHook(() => usePlaces(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.places).toEqual(mockPlaces)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('обрабатывает ошибку загрузки', async () => {
    const errorMessage = 'Ошибка загрузки мест'
    ;(apiClient.getPlacesSimple as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => usePlaces(false))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.places).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('предоставляет функцию refetch', async () => {
    const mockPlaces = [{ id: 1, name: 'Место 1' }]
    ;(apiClient.getPlacesSimple as jest.Mock).mockResolvedValue({
      data: mockPlaces,
    })

    const { result } = renderHook(() => usePlaces(false))

    await waitFor(() => {
      expect(result.current.places).toEqual(mockPlaces)
    })

    const callCount = (apiClient.getPlacesSimple as jest.Mock).mock.calls.length

    result.current.refetch()

    await waitFor(() => {
      expect((apiClient.getPlacesSimple as jest.Mock).mock.calls.length).toBe(
        callCount + 1
      )
    })
  })
})
