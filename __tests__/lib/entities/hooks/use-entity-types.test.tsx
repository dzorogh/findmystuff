import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { TenantProvider } from '@/contexts/tenant-context'
import { useEntityTypes, clearEntityTypesCache } from '@/lib/entities/hooks/use-entity-types'
import { getEntityTypes } from '@/lib/entities/api'

jest.mock('@/lib/entities/api')
jest.mock('@/lib/tenants/api', () => ({
  getTenants: jest.fn().mockResolvedValue([{ id: 1, name: 'Test', created_at: '' }]),
  switchTenant: jest.fn().mockResolvedValue(undefined),
}))

describe('useEntityTypes', () => {
  beforeEach(() => {
    clearEntityTypesCache()
    jest.clearAllMocks()
  })

  it('загружает типы и возвращает их', async () => {
    const mockTypes = [
      { id: 1, name: 'Box', entity_category: 'container' },
      { id: 2, name: 'Shelf', entity_category: 'place' },
    ]
    ;(getEntityTypes as jest.Mock).mockResolvedValue({ data: mockTypes })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    )
    const { result } = renderHook(() => useEntityTypes(), { wrapper })

    await waitFor(() => {
      expect(result.current.types).toEqual(mockTypes)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(getEntityTypes).toHaveBeenCalledWith(undefined, 1)
  })

  it('передаёт category в getEntityTypes', async () => {
    ;(getEntityTypes as jest.Mock).mockResolvedValue({ data: [] })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    )
    const { result } = renderHook(() => useEntityTypes('container'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(getEntityTypes).toHaveBeenCalledWith('container', 1)
  })

  it('устанавливает error при ошибке API', async () => {
    ;(getEntityTypes as jest.Mock).mockResolvedValue({
      error: 'Ошибка загрузки типов',
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    )
    const { result } = renderHook(() => useEntityTypes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.types).toEqual([])
    expect(result.current.error).toBe('Ошибка загрузки типов')
  })

  it('refetch сбрасывает кэш и перезапрашивает', async () => {
    ;(getEntityTypes as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'A' }] })
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    )
    const { result } = renderHook(() => useEntityTypes(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.types).toHaveLength(1)

    result.current.refetch()

    await waitFor(() => {
      expect(getEntityTypes).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(result.current.types).toHaveLength(2)
    })
  })
})
