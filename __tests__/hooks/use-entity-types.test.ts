import { renderHook, waitFor } from '@testing-library/react'
import { useEntityTypes, clearEntityTypesCache } from '@/hooks/use-entity-types'
import { apiClient } from '@/lib/api-client'

jest.mock('@/lib/api-client')

describe('useEntityTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearEntityTypesCache()
  })

  it('загружает типы сущностей при монтировании', async () => {
    const mockTypes = [
      { id: 1, name: 'Тип 1', category: 'container' },
      { id: 2, name: 'Тип 2', category: 'container' },
    ]

    ;(apiClient.getEntityTypes as jest.Mock).mockResolvedValue({
      data: mockTypes,
    })

    const { result } = renderHook(() => useEntityTypes())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.types).toEqual(mockTypes)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('загружает типы с категорией', async () => {
    const mockTypes = [{ id: 1, name: 'Тип 1', category: 'container' }]

    ;(apiClient.getEntityTypes as jest.Mock).mockResolvedValue({
      data: mockTypes,
    })

    const { result } = renderHook(() => useEntityTypes('container'))

    await waitFor(() => {
      expect(apiClient.getEntityTypes).toHaveBeenCalledWith('container')
    })

    await waitFor(() => {
      expect(result.current.types).toEqual(mockTypes)
    })
  })

  it('обрабатывает ошибку загрузки', async () => {
    const errorMessage = 'Ошибка загрузки типов'
    
    // Очищаем кеш перед тестом
    clearEntityTypesCache()
    
    // Мокаем API чтобы он возвращал ошибку
    ;(apiClient.getEntityTypes as jest.Mock).mockResolvedValue({
      error: errorMessage,
    })

    const { result } = renderHook(() => useEntityTypes())

    // Код бросает исключение при response.error, которое ловится и устанавливает error
    await waitFor(
      () => {
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.types).toEqual([])
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 }
    )
    
    // Проверяем, что API был вызван
    expect(apiClient.getEntityTypes).toHaveBeenCalled()
  }, 15000)

  it('кеширует результаты для одинаковых категорий', async () => {
    const mockTypes = [{ id: 1, name: 'Тип 1', category: 'container' }]
    
    // Очищаем кеш перед тестом
    clearEntityTypesCache()
    
    // Мокаем API - будет вызван только один раз благодаря кешу
    ;(apiClient.getEntityTypes as jest.Mock).mockResolvedValue({
      data: mockTypes,
    })

    const { result: result1, unmount: unmount1 } = renderHook(() =>
      useEntityTypes('container')
    )

    await waitFor(
      () => {
        expect(result1.current.types).toEqual(mockTypes)
        expect(result1.current.isLoading).toBe(false)
      },
      { timeout: 3000 }
    )

    // Проверяем, что API был вызван первый раз
    expect(apiClient.getEntityTypes).toHaveBeenCalledWith('container')

    unmount1()

    // Небольшая задержка для очистки
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Второй хук с той же категорией должен использовать кеш
    const { result: result2 } = renderHook(() => useEntityTypes('container'))

    // Должен сразу вернуть данные из кеша (без загрузки)
    await waitFor(
      () => {
        expect(result2.current.types).toEqual(mockTypes)
        expect(result2.current.isLoading).toBe(false)
      },
      { timeout: 1000 }
    )

    // API должен быть вызван только один раз (кеш использован)
    // Используем toHaveBeenCalledTimes с учетом того, что мок может быть вызван несколько раз
    const callCount = (apiClient.getEntityTypes as jest.Mock).mock.calls.length
    expect(callCount).toBe(1)
  })
})
