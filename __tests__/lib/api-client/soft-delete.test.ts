import { SoftDeleteApi } from '@/lib/api-client/soft-delete'

global.fetch = jest.fn()

describe('SoftDeleteApi', () => {
  const softDeleteApi = new SoftDeleteApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('выполняет мягкое удаление', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await softDeleteApi.softDelete('items', 1)

    expect(response.data).toBeDefined()
    expect(response.data?.success).toBe(true)
  })

  it('восстанавливает удаленную сущность', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await softDeleteApi.restoreDeleted('items', 1)

    expect(response.data).toBeDefined()
    expect(response.data?.success).toBe(true)
  })

  it('работает с разными типами таблиц', async () => {
    const tables = ['items', 'places', 'containers', 'rooms'] as const

    for (const table of tables) {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      })

      const response = await softDeleteApi.softDelete(table, 1)

      expect(response.data).toBeDefined()
    }
  })

  it('обрабатывает ошибки', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Ошибка удаления' }),
    })

    const response = await softDeleteApi.softDelete('items', 1)

    expect(response.error).toBe('Ошибка удаления')
  })
})
