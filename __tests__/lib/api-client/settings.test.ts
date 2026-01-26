import { SettingsApi } from '@/lib/api-client/settings'

global.fetch = jest.fn()

describe('SettingsApi', () => {
  const settingsApi = new SettingsApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает настройки', async () => {
    const mockSettings = [
      {
        id: 1,
        key: 'container_types',
        value: 'КОР,ПЛА',
        description: null,
        category: 'container',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: null,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { data: mockSettings },
      }),
    })

    const response = await settingsApi.getSettings()

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('кеширует результаты', async () => {
    const mockSettings = [{ id: 1, key: 'test', value: 'value' } as any]
    let callCount = 0

    // Очищаем кеш через обновление настройки (это очищает кеш)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { success: true } }),
    })
    await settingsApi.updateSetting('dummy', 'dummy')
    jest.clearAllMocks()

    ;(global.fetch as jest.Mock).mockImplementation(async (url: string, options?: any) => {
      // Игнорируем вызовы updateSetting (PUT запросы)
      if (options?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({ data: { success: true } }),
        }
      }
      callCount++
      return {
        ok: true,
        json: async () => ({
          data: { data: mockSettings },
        }),
      }
    })

    const response1 = await settingsApi.getSettings()
    const response2 = await settingsApi.getSettings()

    expect(response1.data).toEqual(response2.data)
    expect(Array.isArray(response1.data)).toBe(true)
    // fetch должен быть вызван только один раз благодаря кешу
    expect(callCount).toBe(1)
  })

  it('обновляет настройку', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await settingsApi.updateSetting('test_key', 'test_value')

    expect(response.data).toBeDefined()
    expect(response.data?.success).toBe(true)
  })

  it('обновляет пользовательскую настройку', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await settingsApi.updateSetting(
      'test_key',
      'test_value',
      true
    )

    expect(response.data).toBeDefined()
  })

  it('обрабатывает ошибки', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Ошибка обновления' }),
    })

    const response = await settingsApi.updateSetting('test_key', 'test_value')

    expect(response.error).toBe('Ошибка обновления')
  })
})
