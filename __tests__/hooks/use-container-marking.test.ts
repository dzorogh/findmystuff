import { renderHook } from '@testing-library/react'
import { useContainerMarking } from '@/hooks/use-container-marking'
import { useSettings } from '@/hooks/use-settings'

jest.mock('@/hooks/use-settings', () => ({
  useSettings: jest.fn(),
}))

describe('useContainerMarking', () => {
  it('генерирует маркировку с шаблоном из настроек', () => {
    const mockGetMarkingTemplate = jest.fn().mockReturnValue('{TYPE}-{NUMBER:4}')
    ;(useSettings as jest.Mock).mockReturnValue({
      getMarkingTemplate: mockGetMarkingTemplate,
    })

    const { result } = renderHook(() => useContainerMarking())

    const marking = result.current.generateMarking('КОР', 5)

    expect(marking).toBe('КОР-0005')
    expect(mockGetMarkingTemplate).toHaveBeenCalled()
  })

  it('возвращает null при отсутствии типа', () => {
    const mockGetMarkingTemplate = jest.fn().mockReturnValue('{TYPE}-{NUMBER}')
    ;(useSettings as jest.Mock).mockReturnValue({
      getMarkingTemplate: mockGetMarkingTemplate,
    })

    const { result } = renderHook(() => useContainerMarking())

    const marking = result.current.generateMarking(null, 5)

    expect(marking).toBeNull()
  })

  it('возвращает null при отсутствии номера', () => {
    const mockGetMarkingTemplate = jest.fn().mockReturnValue('{TYPE}-{NUMBER}')
    ;(useSettings as jest.Mock).mockReturnValue({
      getMarkingTemplate: mockGetMarkingTemplate,
    })

    const { result } = renderHook(() => useContainerMarking())

    const marking = result.current.generateMarking('КОР', null)

    expect(marking).toBeNull()
  })
})
