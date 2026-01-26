import { PlacesApi } from '@/lib/api-client/places'

global.fetch = jest.fn()

describe('PlacesApi', () => {
  const placesApi = new PlacesApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает список мест', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Место 1' }],
      }),
    })

    const response = await placesApi.getPlaces()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('получает список мест с параметрами', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
      }),
    })

    const response = await placesApi.getPlaces({
      query: 'тест',
      showDeleted: true,
    })

    expect(response.data).toBeDefined()
  })

  it('получает место по ID', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          place: { id: 1, name: 'Место 1' },
          transitions: [],
          items: [],
        },
      }),
    })

    const response = await placesApi.getPlace(1)

    expect(response.data).toBeDefined()
    expect(response.data?.place).toBeDefined()
    expect(response.data?.place.id).toBe(1)
  })

  it('получает простой список мест', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Место 1' }],
      }),
    })

    const response = await placesApi.getPlacesSimple(false)

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('создает новое место', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Тестовое место',
        },
      }),
    })

    const response = await placesApi.createPlace({
      name: 'Тестовое место',
    })

    expect(response.data).toBeDefined()
  })

  it('обновляет место', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Обновленное место',
        },
      }),
    })

    const response = await placesApi.updatePlace(1, {
      name: 'Обновленное место',
    })

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Место не найдено' }),
    })

    const response = await placesApi.getPlace(999)

    expect(response.error).toBe('Место не найдено')
  })
})
