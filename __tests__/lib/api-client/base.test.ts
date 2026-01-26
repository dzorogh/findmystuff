import { ApiClientBase } from '@/lib/api-client/base'

// Создаем тестовый класс, наследующийся от ApiClientBase
class TestApiClient extends ApiClientBase {
  async testRequest<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, options)
  }

  get baseUrl() {
    return this.apiBaseUrl
  }
}

// Мокируем fetch
global.fetch = jest.fn()

describe('ApiClientBase', () => {
  let apiClient: TestApiClient

  beforeEach(() => {
    apiClient = new TestApiClient()
    jest.clearAllMocks()
  })

  it('возвращает правильный базовый URL', () => {
    expect(apiClient.baseUrl).toBe('/api')
  })

  it('выполняет успешный запрос', async () => {
    const mockData = { data: { id: 1, name: 'Test' } }
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    })

    const response = await apiClient.testRequest('/test')

    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(response).toEqual(mockData)
  })

  it('обрабатывает ошибку HTTP', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    })

    const response = await apiClient.testRequest('/test')

    expect(response.error).toBe('Not found')
  })

  it('добавляет кастомные заголовки', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    })

    await apiClient.testRequest('/test', {
      headers: { 'X-Custom-Header': 'value' },
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        }),
      })
    )
  })

  it('обрабатывает ошибки сети', async () => {
    const networkError = new Error('Network error')
    ;(fetch as jest.Mock).mockRejectedValue(networkError)

    await expect(apiClient.testRequest('/test')).rejects.toThrow('Network error')
  })

  it('отправляет тело запроса', async () => {
    const requestBody = { name: 'Test' }
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    })

    await apiClient.testRequest('/test', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
    )
  })
})
