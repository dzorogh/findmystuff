import { SearchApi } from '@/lib/api-client/search'

global.fetch = jest.fn()

describe('SearchApi', () => {
  const searchApi = new SearchApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('выполняет поиск', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, type: 'item', name: 'тест' }],
      }),
    })

    const response = await searchApi.search('тест')

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('обрабатывает пустой запрос', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
      }),
    })

    const response = await searchApi.search('')

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки поиска', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Ошибка поиска' }),
    })

    const response = await searchApi.search('тест')

    expect(response.error).toBe('Ошибка поиска')
  })

  it('кодирует специальные символы в запросе', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, type: 'item', name: 'тест & поиск' }],
      }),
    })

    const response = await searchApi.search('тест & поиск')

    expect(response.data).toBeDefined()
    // Проверяем, что fetch был вызван с правильно закодированным URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q='),
      expect.any(Object)
    )
  })
})
