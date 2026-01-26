import { renderHook } from '@testing-library/react'
import { usePlaceMarking } from '@/hooks/use-place-marking'
import { useSettings } from '@/hooks/use-settings'

jest.mock('@/hooks/use-settings', () => ({
  useSettings: jest.fn(),
}))

describe('usePlaceMarking', () => {
  it('генерирует маркировку с шаблоном из настроек', () => {
    const mockGetPlaceMarkingTemplate = jest
      .fn()
      .mockReturnValue('{TYPE}-{NUMBER:2}')
    ;(useSettings as jest.Mock).mockReturnValue({
      getPlaceMarkingTemplate: mockGetPlaceMarkingTemplate,
    })

    const { result } = renderHook(() => usePlaceMarking())

    const marking = result.current.generateMarking('ПОЛ', 5)

    expect(marking).toBe('ПОЛ-05')
    expect(mockGetPlaceMarkingTemplate).toHaveBeenCalled()
  })

  it('возвращает null при отсутствии типа', () => {
    const mockGetPlaceMarkingTemplate = jest.fn().mockReturnValue('{TYPE}-{NUMBER}')
    ;(useSettings as jest.Mock).mockReturnValue({
      getPlaceMarkingTemplate: mockGetPlaceMarkingTemplate,
    })

    const { result } = renderHook(() => usePlaceMarking())

    const marking = result.current.generateMarking(null, 5)

    expect(marking).toBeNull()
  })
})
