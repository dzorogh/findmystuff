import { applyDeletedFilter, applyNameSearch } from '@/lib/shared/supabase/query-builder'

describe('query-builder', () => {
  describe('applyDeletedFilter', () => {
    it('применяет фильтр для не удаленных сущностей', () => {
      const mockQueryBuilder = {
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
      }

      const result = applyDeletedFilter(mockQueryBuilder as any, false)

      expect(mockQueryBuilder.is).toHaveBeenCalledWith('deleted_at', null)
      expect(mockQueryBuilder.not).not.toHaveBeenCalled()
    })

    it('применяет фильтр для удаленных сущностей', () => {
      const mockQueryBuilder = {
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
      }

      const result = applyDeletedFilter(mockQueryBuilder as any, true)

      expect(mockQueryBuilder.not).toHaveBeenCalledWith('deleted_at', 'is', null)
      expect(mockQueryBuilder.is).not.toHaveBeenCalled()
    })
  })

  describe('applyNameSearch', () => {
    it('не применяет поиск для пустого запроса', () => {
      const mockQueryBuilder = {
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      }

      const result = applyNameSearch(mockQueryBuilder as any, '')

      expect(mockQueryBuilder.ilike).not.toHaveBeenCalled()
      expect(mockQueryBuilder.or).not.toHaveBeenCalled()
    })

    it('применяет поиск для одного поля', () => {
      const mockQueryBuilder = {
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      }

      const result = applyNameSearch(mockQueryBuilder as any, 'тест', ['name'])

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%тест%')
    })

    it('применяет поиск для нескольких полей', () => {
      const mockQueryBuilder = {
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      }

      const result = applyNameSearch(mockQueryBuilder as any, 'тест', [
        'name',
        'description',
      ])

      expect(mockQueryBuilder.or).toHaveBeenCalled()
    })

    it('обрабатывает числовой поиск', () => {
      const mockQueryBuilder = {
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      }

      const result = applyNameSearch(mockQueryBuilder as any, '123', [
        'name',
        'id',
      ])

      expect(mockQueryBuilder.or).toHaveBeenCalled()
    })

    it('обрезает пробелы в запросе', () => {
      const mockQueryBuilder = {
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      }

      const result = applyNameSearch(mockQueryBuilder as any, '  тест  ', [
        'name',
      ])

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%тест%')
    })
  })
})
