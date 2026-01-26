import { ContainersApi } from '@/lib/api-client/containers'

global.fetch = jest.fn()

describe('ContainersApi', () => {
  const containersApi = new ContainersApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает список контейнеров', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Контейнер 1' }],
      }),
    })

    const response = await containersApi.getContainers()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('получает список контейнеров с параметрами', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
      }),
    })

    const response = await containersApi.getContainers({
      query: 'тест',
      showDeleted: true,
    })

    expect(response.data).toBeDefined()
  })

  it('получает контейнер по ID', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          container: { id: 1, name: 'Контейнер 1' },
          transitions: [],
          items: [],
        },
      }),
    })

    const response = await containersApi.getContainer(1)

    expect(response.data).toBeDefined()
    expect(response.data?.container).toBeDefined()
    expect(response.data?.container.id).toBe(1)
  })

  it('получает простой список контейнеров', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Контейнер 1' }],
      }),
    })

    const response = await containersApi.getContainersSimple(false)

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('создает новый контейнер', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Тестовый контейнер',
        },
      }),
    })

    const response = await containersApi.createContainer({
      name: 'Тестовый контейнер',
    })

    expect(response.data).toBeDefined()
  })

  it('обновляет контейнер', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Обновленный контейнер',
        },
      }),
    })

    const response = await containersApi.updateContainer(1, {
      name: 'Обновленный контейнер',
    })

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Контейнер не найден' }),
    })

    const response = await containersApi.getContainer(999)

    expect(response.error).toBe('Контейнер не найден')
  })
})
