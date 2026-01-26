import { auth } from '@/lib/auth'

jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config) => ({
    baseURL: config.baseURL,
    database: config.database,
    emailAndPassword: config.emailAndPassword,
    socialProviders: config.socialProviders,
  })),
}))

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
  })),
}))

jest.mock('@/lib/supabase/database-url', () => ({
  getDatabaseUrl: jest.fn(() => 'postgresql://test:test@localhost:5432/test'),
}))

describe('auth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('создает auth с правильным baseURL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    jest.resetModules()
    const { betterAuth } = require('better-auth')
    require('@/lib/auth')
    
    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://example.com',
      })
    )
  })

  it('выбрасывает ошибку если NEXT_PUBLIC_APP_URL не установлен', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    jest.resetModules()
    expect(() => {
      require('@/lib/auth')
    }).toThrow('NEXT_PUBLIC_APP_URL is not set')
  })

  it('настраивает emailAndPassword', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    jest.resetModules()
    const { betterAuth } = require('better-auth')
    require('@/lib/auth')
    
    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAndPassword: {
          enabled: true,
        },
      })
    )
  })

  it('настраивает Google провайдер если credentials установлены', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    jest.resetModules()
    const { betterAuth } = require('better-auth')
    require('@/lib/auth')
    
    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: {
          google: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          },
        },
      })
    )
  })
})
