import { renderHook, waitFor } from '@testing-library/react'
import { useEntityTypes, clearEntityTypesCache } from '@/lib/entities/hooks/use-entity-types'
import { getEntityTypes } from '@/lib/entities/api'

jest.mock('@/lib/entities/api')

describe('useEntityTypes', () => {
  beforeEach(() => {
    clearEntityTypesCache()
    jest.clearAllMocks()
  })

  it('загружает типы и возвращает их', async () => {
    const mockTypes = [
      { id: 1, name: 'Box', entity_category: 'container' },
      { id: 2, name: 'Shelf', entity_category: 'place' },
    ]
    ;(getEntityTypes as jest.Mock).mockResolvedValue({ data: mockTypes })

    const { result } = renderHook(() => useEntityTypes())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.types).toEqual(mockTypes)
    expect(result.current.error).toBeNull()
    expect(getEntityTypes).toHaveBeenCalledWith(undefined)
  })

  it('передаёт category в getEntityTypes', async () => {
    ;(getEntityTypes as jest.Mock).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useEntityTypes('container'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getEntityTypes).toHaveBeenCalledWith('container')
  })

  it('устанавливает error при ошибке API', async () => {
    ;(getEntityTypes as jest.Mock).mockResolvedValue({
      error: 'Ошибка загрузки типов',
    })

    const { result } = renderHook(() => useEntityTypes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.types).toEqual([])
    expect(result.current.error).toBe('Ошибка загрузки типов')
  })

  it('refetch сбрасывает кэш и перезапрашивает', async () => {
    ;(getEntityTypes as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'A' }] })
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] })

    const { result } = renderHook(() => useEntityTypes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.types).toHaveLength(1)

    result.current.refetch()

    await waitFor(() => {
      expect(getEntityTypes).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(result.current.types).toHaveLength(2)
    })
  })
})
