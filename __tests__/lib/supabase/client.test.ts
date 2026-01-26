import { createClient } from '@/lib/supabase/client'

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn((url, key) => ({
    url,
    key,
    type: 'browser',
  })),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
    type: 'server',
  })),
}))

describe('createClient (supabase/client)', () => {
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

  it('создает клиент с правильными параметрами', () => {
    const { createClient } = require('@/lib/supabase/client')
    
    const client = createClient()
    
    // Проверяем что клиент создан
    expect(client).toBeDefined()
    // В тестовом окружении window определен, поэтому будет browser клиент
    expect(client.url).toBe('https://project.supabase.co')
    expect(client.key).toBe('test-key')
  })

  it('создает браузерный клиент когда window определен', () => {
    // @ts-ignore
    global.window = {}
    jest.resetModules()
    const { createClient } = require('@/lib/supabase/client')
    
    const client = createClient()
    
    // Проверяем что клиент создан и имеет правильный тип
    expect(client).toBeDefined()
    expect(client.type).toBe('browser')
    expect(client.url).toBe('https://project.supabase.co')
    expect(client.key).toBe('test-key')
  })

  it('переиспользует браузерный клиент при повторных вызовах', () => {
    // @ts-ignore
    global.window = {}
    jest.resetModules()
    const { createClient } = require('@/lib/supabase/client')
    
    const client1 = createClient()
    const client2 = createClient()
    
    // Клиент должен быть переиспользован (тот же объект)
    expect(client1).toBe(client2)
  })
})
