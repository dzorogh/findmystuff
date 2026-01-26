import { renderHook, waitFor, act } from '@testing-library/react'
import { useListState } from '@/hooks/use-list-state'
import { useUser } from '@/hooks/use-user'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}))

jest.mock('@/hooks/use-user', () => ({
  useUser: jest.fn(),
}))

const mockPush = jest.fn()

describe('useListState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    })
    ;(useUser as jest.Mock).mockReturnValue({
      user: { id: '1' },
      isLoading: false,
    })
  })

  it('инициализируется с дефолтными значениями', () => {
    const { result } = renderHook(() => useListState())

    expect(result.current.searchQuery).toBe('')
    expect(result.current.showDeleted).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSearching).toBe(false)
  })

  it('обновляет searchQuery из внешнего пропса', () => {
    const { result, rerender } = renderHook(
      ({ externalSearchQuery }) => useListState({ externalSearchQuery }),
      { initialProps: { externalSearchQuery: 'начальный' } }
    )

    expect(result.current.searchQuery).toBe('начальный')

    rerender({ externalSearchQuery: 'обновленный' })

    expect(result.current.searchQuery).toBe('обновленный')
  })

  it('обновляет showDeleted из внешнего пропса', () => {
    const { result, rerender } = renderHook(
      ({ externalShowDeleted }) => useListState({ externalShowDeleted }),
      { initialProps: { externalShowDeleted: false } }
    )

    expect(result.current.showDeleted).toBe(false)

    rerender({ externalShowDeleted: true })

    expect(result.current.showDeleted).toBe(true)
  })

  it('перенаправляет на главную, если пользователь не авторизован', async () => {
    ;(useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    renderHook(() => useListState())

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('вызывает onSearchStateChange при обновлении состояния поиска', async () => {
    const onSearchStateChange = jest.fn()
    const { result } = renderHook(() =>
      useListState({ onSearchStateChange })
    )

    await act(async () => {
      result.current.updateSearchState(true, 5)
    })

    expect(onSearchStateChange).toHaveBeenCalledWith({
      isSearching: true,
      resultsCount: 5,
    })
  })

  it('управляет состоянием загрузки', async () => {
    const { result } = renderHook(() => useListState())

    await act(async () => {
      result.current.startLoading(true)
    })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSearching).toBe(true)

    await act(async () => {
      result.current.finishLoading(true, 10)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSearching).toBe(false)
  })

  it('обрабатывает ошибки', async () => {
    const { result } = renderHook(() => useListState())

    const error = new Error('Тестовая ошибка')
    
    await act(async () => {
      result.current.handleError(error, true)
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Тестовая ошибка')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isSearching).toBe(false)
    })
  })
})
