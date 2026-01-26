import { createClient } from '@/lib/supabase/server'

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
  })),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}))

describe('createClient (supabase/server)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('создает серверный клиент с cookies', async () => {
    const { createServerClient } = require('@supabase/ssr')
    const { cookies } = require('next/headers')
    const cookieStore = await cookies()
    
    const client = await createClient()
    
    expect(createServerClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'test-key',
      expect.objectContaining({
        cookies: {
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        },
      })
    )
  })

  it('обрабатывает cookies через cookieStore', async () => {
    const mockGetAll = jest.fn(() => [
      { name: 'test-cookie', value: 'test-value' },
    ])
    const mockCookies = jest.fn(async () => ({
      getAll: mockGetAll,
      set: jest.fn(),
    }))
    
    jest.doMock('next/headers', () => ({
      cookies: mockCookies,
    }))
    
    jest.resetModules()
    const { createClient } = require('@/lib/supabase/server')
    await createClient()
    
    const { createServerClient } = require('@supabase/ssr')
    expect(createServerClient).toHaveBeenCalled()
    const callArgs = createServerClient.mock.calls[0]
    const cookiesConfig = callArgs[2].cookies
    
    const allCookies = cookiesConfig.getAll()
    expect(allCookies).toEqual([
      { name: 'test-cookie', value: 'test-value' },
    ])
  })

  it('обрабатывает setAll без ошибок', async () => {
    const mockSet = jest.fn()
    const mockGetAll = jest.fn(() => [])
    const mockCookies = jest.fn(async () => ({
      getAll: mockGetAll,
      set: mockSet,
    }))
    
    jest.doMock('next/headers', () => ({
      cookies: mockCookies,
    }))
    
    jest.resetModules()
    const { createClient } = require('@/lib/supabase/server')
    await createClient()
    
    const { createServerClient } = require('@supabase/ssr')
    const callArgs = createServerClient.mock.calls[0]
    const cookiesConfig = callArgs[2].cookies
    
    // Вызываем setAll - не должно быть ошибок
    cookiesConfig.setAll([
      { name: 'new-cookie', value: 'new-value', options: {} },
    ])
    
    expect(mockSet).toHaveBeenCalled()
  })
})
