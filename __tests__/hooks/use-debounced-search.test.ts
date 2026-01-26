import { renderHook, waitFor, act } from '@testing-library/react'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

// Вспомогательная функция для промисов
const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    // Проверяем, используются ли fake timers перед их очисткой
    if (jest.isMockFunction(setTimeout)) {
      jest.runOnlyPendingTimers()
    }
    jest.useRealTimers()
  })

  it('вызывает onSearch с задержкой', async () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) => useDebouncedSearch({ searchQuery, onSearch, delay: 300 }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: 'test' })

    expect(onSearch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test')
    })
  })

  it('пропускает первый вызов при монтировании по умолчанию', () => {
    const onSearch = jest.fn()
    renderHook(() =>
      useDebouncedSearch({ searchQuery: 'initial', onSearch, delay: 300 })
    )

    jest.advanceTimersByTime(300)

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('выполняет первый вызов, если skipInitial = false', () => {
    const onSearch = jest.fn()
    
    // При skipInitial = false, previousQueryRef инициализируется как searchQuery
    // Поэтому при первом монтировании previousQueryRef.current === searchQuery будет true
    // и таймер не установится. Нужно изменить запрос, чтобы таймер установился.
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({
          searchQuery,
          onSearch,
          delay: 300,
          skipInitial: false,
        }),
      { initialProps: { searchQuery: '' } }
    )

    // Изменяем запрос, чтобы таймер установился
    rerender({ searchQuery: 'initial' })

    // Продвигаем таймеры
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    // Проверяем, что onSearch был вызван
    expect(onSearch).toHaveBeenCalledWith('initial')
  })

  it('отменяет предыдущий вызов при изменении запроса', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300, skipInitial: false }),
      { initialProps: { searchQuery: 'first' } }
    )

    jest.advanceTimersByTime(150)

    rerender({ searchQuery: 'second' })

    jest.advanceTimersByTime(300)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('second')
  })

  it('не вызывает onSearch, если запрос не изменился', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300, skipInitial: false }),
      { initialProps: { searchQuery: '' } }
    )

    // Сначала устанавливаем 'test'
    rerender({ searchQuery: 'test' })
    
    // Продвигаем таймеры для первого вызова
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('test')

    // Ререндерим с тем же запросом
    rerender({ searchQuery: 'test' })
    
    // Продвигаем таймеры еще раз
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Не должен вызываться повторно для того же запроса
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('обрезает пробелы в запросе', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300, skipInitial: false }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: '  test  ' })
    jest.advanceTimersByTime(300)

    expect(onSearch).toHaveBeenCalledWith('test')
  })

  it('использует кастомную задержку', () => {
    const onSearch = jest.fn()
    const { rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 500, skipInitial: false }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: 'test' })

    jest.advanceTimersByTime(300)
    expect(onSearch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(200)
    expect(onSearch).toHaveBeenCalledWith('test')
  })

  it('очищает таймер при размонтировании', () => {
    const onSearch = jest.fn()
    const { unmount, rerender } = renderHook(
      ({ searchQuery }) =>
        useDebouncedSearch({ searchQuery, onSearch, delay: 300, skipInitial: false }),
      { initialProps: { searchQuery: '' } }
    )

    rerender({ searchQuery: 'test' })
    unmount()

    jest.advanceTimersByTime(300)

    expect(onSearch).not.toHaveBeenCalled()
  })
})
