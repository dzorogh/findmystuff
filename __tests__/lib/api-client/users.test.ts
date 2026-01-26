import { UsersApi } from '@/lib/api-client/users'

global.fetch = jest.fn()

describe('UsersApi', () => {
  const usersApi = new UsersApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('получает список пользователей', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com' },
      { id: '2', email: 'user2@example.com' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { users: mockUsers },
      }),
    })

    const response = await usersApi.getUsers()

    expect(response.data).toBeDefined()
    expect(response.data?.users).toEqual(mockUsers)
  })

  it('создает нового пользователя', async () => {
    const mockUser = { id: '1', email: 'new@example.com' }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { user: mockUser, password: 'temp_password' },
      }),
    })

    const response = await usersApi.createUser({
      email: 'new@example.com',
    })

    expect(response.data).toBeDefined()
    expect(response.data?.user).toEqual(mockUser)
  })

  it('обновляет пользователя', async () => {
    const mockUser = { id: '1', email: 'updated@example.com' }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { user: mockUser, password: 'new_password' },
      }),
    })

    const response = await usersApi.updateUser({
      id: '1',
      email: 'updated@example.com',
    })

    expect(response.data).toBeDefined()
    expect(response.data?.user).toEqual(mockUser)
  })

  it('удаляет пользователя', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { success: true },
      }),
    })

    const response = await usersApi.deleteUser('1')

    expect(response.data).toBeDefined()
    expect(response.data?.success).toBe(true)
  })

  it('обрабатывает ошибки', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Пользователь не найден' }),
    })

    const response = await usersApi.getUsers()

    expect(response.error).toBe('Пользователь не найден')
  })
})
