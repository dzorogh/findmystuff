import { renderHook, act } from '@testing-library/react'
import { useListState } from '@/lib/app/hooks/use-list-state'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/users/context', () => ({
  useUser: () => ({
    user: { id: 'user-1' },
    isLoading: false,
  }),
}))

describe('useListState', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('возвращает начальное состояние и функции', () => {
    const { result } = renderHook(() => useListState({}))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSearching).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.searchQuery).toBe('string')
    expect(typeof result.current.showDeleted).toBe('boolean')
    expect(typeof result.current.startLoading).toBe('function')
    expect(typeof result.current.finishLoading).toBe('function')
    expect(typeof result.current.handleError).toBe('function')
    expect(typeof result.current.updateSearchState).toBe('function')
    expect(typeof result.current.setError).toBe('function')
  })

  it('использует externalSearchQuery и externalShowDeleted', () => {
    const { result } = renderHook(() =>
      useListState({
        externalSearchQuery: 'query',
        externalShowDeleted: true,
      })
    )

    expect(result.current.searchQuery).toBe('query')
    expect(result.current.showDeleted).toBe(true)
  })

  it('startLoading устанавливает isSearching и сбрасывает error', () => {
    const { result } = renderHook(() => useListState({}))

    act(() => {
      result.current.setError('Previous error')
    })

    expect(result.current.error).toBe('Previous error')

    act(() => {
      result.current.startLoading(false)
    })

    expect(result.current.isSearching).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('finishLoading сбрасывает isSearching и вызывает onSearchStateChange', () => {
    const onSearchStateChange = jest.fn()
    const { result } = renderHook(() =>
      useListState({ onSearchStateChange })
    )

    act(() => {
      result.current.startLoading(true)
    })

    act(() => {
      result.current.finishLoading(true, 5)
    })

    expect(result.current.isSearching).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(onSearchStateChange).toHaveBeenCalledWith({
      isSearching: false,
      resultsCount: 5,
    })
  })

  it('handleError устанавливает error и вызывает onSearchStateChange', () => {
    const onSearchStateChange = jest.fn()
    const { result } = renderHook(() =>
      useListState({ onSearchStateChange })
    )

    act(() => {
      result.current.handleError(new Error('Load failed'), true)
    })

    expect(result.current.error).toBe('Load failed')
    expect(result.current.isLoading).toBe(false)
    expect(onSearchStateChange).toHaveBeenCalledWith({
      isSearching: false,
      resultsCount: 0,
    })
  })

  it('handleError с неизвестной ошибкой использует сообщение по умолчанию', () => {
    const { result } = renderHook(() => useListState({}))

    act(() => {
      result.current.handleError('unknown', false)
    })

    expect(result.current.error).toBe('Произошла ошибка')
  })
})
