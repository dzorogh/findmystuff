import { ItemsApi } from '@/lib/api-client/items'

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ItemsApi', () => {
  const itemsApi = new ItemsApi()

  it('получает список вещей', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Вещь 1' }],
      }),
    })

    const response = await itemsApi.getItems()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('получает вещь по ID', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          item: { id: 1, name: 'Вещь 1' },
          transitions: [],
        },
      }),
    })

    const response = await itemsApi.getItem(1)

    expect(response.data).toBeDefined()
    expect(response.data?.item).toBeDefined()
    expect(response.data?.item.id).toBe(1)
  })

  it('создает новую вещь', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Тестовая вещь',
        },
      }),
    })

    const newItem = {
      name: 'Тестовая вещь',
      destination_type: undefined,
      destination_id: undefined,
      photo_url: undefined,
    }

    const response = await itemsApi.createItem(newItem)

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Вещь не найдена' }),
    })

    const response = await itemsApi.getItem(999)

    expect(response.error).toBe('Вещь не найдена')
  })
})
