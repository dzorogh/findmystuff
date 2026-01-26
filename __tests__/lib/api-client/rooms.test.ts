import { RoomsApi } from '@/lib/api-client/rooms'

// Мокируем fetch вместо использования MSW
global.fetch = jest.fn()

describe('RoomsApi', () => {
  const roomsApi = new RoomsApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает список помещений', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Комната 1' }],
      }),
    })

    const response = await roomsApi.getRooms()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('получает список помещений с параметрами', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
      }),
    })

    const response = await roomsApi.getRooms({
      query: 'тест',
      showDeleted: true,
    })

    expect(response.data).toBeDefined()
  })

  it('получает помещение по ID', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          room: { id: 1, name: 'Комната 1' },
          items: [],
          places: [],
          containers: [],
        },
      }),
    })

    const response = await roomsApi.getRoom(1)

    expect(response.data).toBeDefined()
    expect(response.data?.room).toBeDefined()
    expect(response.data?.room.id).toBe(1)
  })

  it('получает простой список помещений', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 1, name: 'Комната 1' }],
      }),
    })

    const response = await roomsApi.getRoomsSimple(false)

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('создает новое помещение', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Тестовое помещение',
        },
      }),
    })

    const response = await roomsApi.createRoom({
      name: 'Тестовое помещение',
    })

    expect(response.data).toBeDefined()
  })

  it('обновляет помещение', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          name: 'Обновленное помещение',
        },
      }),
    })

    const response = await roomsApi.updateRoom(1, {
      name: 'Обновленное помещение',
    })

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Помещение не найдено' }),
    })

    const response = await roomsApi.getRoom(999)

    expect(response.error).toBe('Помещение не найдено')
  })
})
