import { EntityTypesApi } from '@/lib/api-client/entity-types'

global.fetch = jest.fn()

describe('EntityTypesApi', () => {
  const entityTypesApi = new EntityTypesApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает все типы сущностей', async () => {
    const mockTypes = [
      { id: 1, name: 'Тип 1', category: 'container' },
      { id: 2, name: 'Тип 2', category: 'place' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockTypes,
      }),
    })

    const response = await entityTypesApi.getEntityTypes()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('получает типы сущностей по категории', async () => {
    const mockTypes = [{ id: 1, name: 'Тип 1', category: 'container' }]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockTypes,
      }),
    })

    const response = await entityTypesApi.getEntityTypes('container')

    expect(response.data).toBeDefined()
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=container'),
      expect.any(Object)
    )
  })

  it('создает новый тип сущности', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          entity_category: 'container',
          code: 'НОВ',
          name: 'Новый тип',
        },
      }),
    })

    const response = await entityTypesApi.createEntityType({
      entity_category: 'container',
      code: 'НОВ',
      name: 'Новый тип',
    })

    expect(response.data).toBeDefined()
  })

  it('обновляет тип сущности', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 1,
          code: 'ОБН',
          name: 'Обновленный тип',
        },
      }),
    })

    const response = await entityTypesApi.updateEntityType({
      id: 1,
      code: 'ОБН',
      name: 'Обновленный тип',
    })

    expect(response.data).toBeDefined()
  })

  it('удаляет тип сущности', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await entityTypesApi.deleteEntityType(1)

    expect(response.data).toBeDefined()
    expect(response.data?.success).toBe(true)
  })

  it('обрабатывает ошибки', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Ошибка создания типа' }),
    })

    const response = await entityTypesApi.createEntityType({
      entity_category: 'container',
      code: 'ТЕСТ',
      name: 'Тест',
    })

    expect(response.error).toBe('Ошибка создания типа')
  })
})
