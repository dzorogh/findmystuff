import { renderHook, act } from '@testing-library/react'
import { useDebouncedSearch } from '@/lib/app/hooks/use-debounced-search'

jest.useFakeTimers()

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  it('вызывает onSearch с задержкой при изменении searchQuery', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300 }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: 'test' })

    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledWith('test')
  })

  it('передаёт trim-значение в onSearch', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 100 }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: '  foo  ' })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(onSearch).toHaveBeenCalledWith('foo')
  })

  it('не вызывает onSearch при первом монтировании если skipInitial true', () => {
    const onSearch = jest.fn()
    renderHook(() =>
      useDebouncedSearch({
        searchQuery: 'initial',
        onSearch,
        delay: 300,
        skipInitial: true,
      })
    )

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('вызывает onSearch при изменении после первого монтирования', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({
          searchQuery,
          onSearch,
          delay: 200,
          skipInitial: true,
        }),
      { initialProps: { searchQuery: 'first' } }
    )

    rerender({ searchQuery: 'second' })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(onSearch).toHaveBeenCalledWith('second')
  })

  it('не вызывает onSearch если searchQuery не изменился', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 100 }),
      { initialProps: { searchQuery: 'same' } }
    )

    rerender({ searchQuery: 'same' })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('сбрасывает таймер при новом изменении до истечения задержки', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300 }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: 'a' })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    rerender({ searchQuery: 'ab' })
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(onSearch).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('ab')
  })
})
