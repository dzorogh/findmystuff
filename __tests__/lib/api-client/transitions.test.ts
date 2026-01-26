import { TransitionsApi } from '@/lib/api-client/transitions'

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TransitionsApi', () => {
  const transitionsApi = new TransitionsApi()

  it('создает переход', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          item_id: 1,
          destination_type: 'container',
          destination_id: 2,
        },
      }),
    })

    const response = await transitionsApi.createTransition({
      item_id: 1,
      destination_type: 'container',
      destination_id: 2,
    })

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки при создании перехода', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Ошибка создания перехода' }),
    })

    const response = await transitionsApi.createTransition({
      item_id: 1,
      destination_type: 'container',
      destination_id: 2,
    })

    expect(response.error).toBe('Ошибка создания перехода')
  })

  it('создает переход для разных типов назначения', async () => {
    const types = ['container', 'place', 'room'] as const

    for (const destinationType of types) {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: 1,
            item_id: 1,
            destination_type: destinationType,
            destination_id: 1,
          },
        }),
      })

      const response = await transitionsApi.createTransition({
        item_id: 1,
        destination_type: destinationType,
        destination_id: 1,
      })

      expect(response.data).toBeDefined()
    }
  })
})
