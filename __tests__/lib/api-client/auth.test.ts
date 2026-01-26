import { AuthApi } from '@/lib/api-client/auth'

global.fetch = jest.fn()

describe('AuthApi', () => {
  const authApi = new AuthApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает текущего пользователя', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { user: mockUser },
      }),
    })

    const response = await authApi.getCurrentUser()

    expect(response.data).toBeDefined()
    expect(response.data?.user).toEqual(mockUser)
  })

  it('возвращает null, если пользователь не авторизован', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { user: null },
      }),
    })

    const response = await authApi.getCurrentUser()

    expect(response.data).toBeDefined()
    expect(response.data?.user).toBeNull()
  })

  it('обрабатывает ошибки API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Не авторизован' }),
    })

    const response = await authApi.getCurrentUser()

    expect(response.error).toBe('Не авторизован')
  })
})
