import { render, screen } from '@testing-library/react'
import { MarkingDisplay } from '@/components/common/marking-display'

describe('MarkingDisplay', () => {
  const mockGenerateMarking = jest.fn((type, number) => `${type}-${number}`)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает маркировку', () => {
    render(
      <MarkingDisplay
        typeCode="КОР"
        markingNumber={5}
        generateMarking={mockGenerateMarking}
      />
    )

    expect(screen.getByText(/маркировка: КОР-5/i)).toBeInTheDocument()
    expect(mockGenerateMarking).toHaveBeenCalledWith('КОР', 5)
  })

  it('не отображается, если typeCode не указан', () => {
    const { container } = render(
      <MarkingDisplay
        typeCode={null}
        markingNumber={5}
        generateMarking={mockGenerateMarking}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('не отображается, если markingNumber не указан', () => {
    const { container } = render(
      <MarkingDisplay
        typeCode="КОР"
        markingNumber={null}
        generateMarking={mockGenerateMarking}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('не отображается, если generateMarking возвращает null', () => {
    const generateNull = jest.fn(() => null)
    const { container } = render(
      <MarkingDisplay
        typeCode="КОР"
        markingNumber={5}
        generateMarking={generateNull}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <MarkingDisplay
        typeCode="КОР"
        markingNumber={5}
        generateMarking={mockGenerateMarking}
        className="custom-class"
      />
    )
    const display = container.querySelector('.custom-class')
    expect(display).toBeInTheDocument()
  })
})
