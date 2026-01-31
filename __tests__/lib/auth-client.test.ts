import { authClient } from '@/lib/auth/config/client'

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn((config) => ({
    baseURL: config.baseURL,
  })),
}))

describe('authClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('создает клиент с правильным baseURL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    jest.resetModules()
    const { authClient: newAuthClient } = require('@/lib/auth/config/client')
    expect(newAuthClient.baseURL).toBe('https://example.com')
  })

  it('выбрасывает ошибку если NEXT_PUBLIC_APP_URL не установлен', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    jest.resetModules()
    expect(() => {
      require('@/lib/auth/config/client')
    }).toThrow('NEXT_PUBLIC_APP_URL is not set')
  })
})
