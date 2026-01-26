import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '@/components/ui/combobox'

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
}))

jest.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandInput: ({ placeholder }: any) => (
    <input data-testid="command-input" placeholder={placeholder} />
  ),
  CommandList: ({ children }: any) => (
    <div data-testid="command-list">{children}</div>
  ),
  CommandEmpty: ({ children }: any) => (
    <div data-testid="command-empty">{children}</div>
  ),
  CommandGroup: ({ children }: any) => (
    <div data-testid="command-group">{children}</div>
  ),
  CommandItem: ({ children, onSelect, value }: any) => (
    <div data-testid={`command-item-${value}`} onClick={onSelect}>
      {children}
    </div>
  ),
}))

describe('Combobox', () => {
  const mockOptions = [
    { value: '1', label: 'Опция 1' },
    { value: '2', label: 'Опция 2' },
    { value: '3', label: 'Опция 3' },
  ]

  const mockOnValueChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('рендерится с опциями', () => {
    render(
      <Combobox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
      />
    )

    expect(screen.getByText('Выберите значение...')).toBeInTheDocument()
  })

  it('отображает выбранное значение', () => {
    const { container } = render(
      <Combobox
        options={mockOptions}
        value="1"
        onValueChange={mockOnValueChange}
      />
    )

    // Ищем текст в кнопке (триггере), а не в списке опций
    const button = container.querySelector('button[role="combobox"]')
    expect(button).toHaveTextContent('Опция 1')
  })

  it('использует кастомный placeholder', () => {
    render(
      <Combobox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
        placeholder="Выберите опцию"
      />
    )

    expect(screen.getByText('Выберите опцию')).toBeInTheDocument()
  })

  it('отключается, когда disabled = true', () => {
    const { container } = render(
      <Combobox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
        disabled={true}
      />
    )

    const button = container.querySelector('button')
    expect(button).toBeDisabled()
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <Combobox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
        className="custom-combobox"
      />
    )

    const button = container.querySelector('.custom-combobox')
    expect(button).toBeInTheDocument()
  })
})
