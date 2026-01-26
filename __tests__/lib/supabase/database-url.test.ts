import { getDatabaseUrl } from '@/lib/supabase/database-url'

describe('getDatabaseUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('возвращает DATABASE_URL если установлен', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    expect(getUrl()).toBe('postgresql://user:pass@localhost:5432/db')
  })

  it('строит URL из Supabase переменных', () => {
    delete process.env.DATABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_DB_PASSWORD = 'test-password'
    process.env.SUPABASE_REGION = 'us-east-1'
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    const url = getUrl()
    expect(url).toContain('postgres.project')
    expect(url).toContain('test-password')
    expect(url).toContain('us-east-1')
    expect(url).toContain('pooler.supabase.com:6543')
  })

  it('использует регион по умолчанию если SUPABASE_REGION не установлен', () => {
    delete process.env.DATABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_DB_PASSWORD = 'test-password'
    delete process.env.SUPABASE_REGION
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    const url = getUrl()
    expect(url).toContain('us-east-1')
  })

  it('возвращает placeholder при сборке', () => {
    delete process.env.DATABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PHASE = 'phase-production-build'
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    expect(getUrl()).toBe('postgresql://placeholder:placeholder@localhost:5432/placeholder')
  })

  it('выбрасывает ошибку с инструкциями если не может построить URL', () => {
    delete process.env.DATABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PHASE
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    expect(() => getUrl()).toThrow('DATABASE_URL не установлен')
    expect(() => getUrl()).toThrow('DATABASE_URL')
    expect(() => getUrl()).toThrow('SUPABASE_DB_PASSWORD')
  })

  it('обрабатывает URL без совпадения project-ref', () => {
    delete process.env.DATABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid-url.com'
    process.env.SUPABASE_DB_PASSWORD = 'test-password'
    delete process.env.NEXT_PHASE
    jest.resetModules()
    const { getDatabaseUrl: getUrl } = require('@/lib/supabase/database-url')
    expect(() => getUrl()).toThrow('DATABASE_URL не установлен')
  })
})
