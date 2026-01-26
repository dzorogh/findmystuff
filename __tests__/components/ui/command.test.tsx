import { render, screen } from '@testing-library/react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command'

describe('Command', () => {
  it('рендерится с содержимым', () => {
    render(
      <Command>
        <div>Тест</div>
      </Command>
    )
    expect(screen.getByText('Тест')).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <Command className="custom-command">
        <div>Тест</div>
      </Command>
    )
    const command = container.querySelector('.custom-command')
    expect(command).toBeInTheDocument()
  })
})

describe('CommandInput', () => {
  it('рендерится с placeholder', () => {
    render(
      <Command>
        <CommandInput placeholder="Поиск..." />
      </Command>
    )
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument()
  })
})

describe('CommandList', () => {
  it('рендерится с содержимым', () => {
    render(
      <Command>
        <CommandList>
          <div>Список</div>
        </CommandList>
      </Command>
    )
    expect(screen.getByText('Список')).toBeInTheDocument()
  })
})

describe('CommandEmpty', () => {
  it('отображает сообщение', () => {
    render(
      <Command>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
      </Command>
    )
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })
})

describe('CommandGroup', () => {
  it('рендерится с содержимым', () => {
    render(
      <Command>
        <CommandGroup>
          <div>Группа</div>
        </CommandGroup>
      </Command>
    )
    expect(screen.getByText('Группа')).toBeInTheDocument()
  })
})

describe('CommandItem', () => {
  it('рендерится с содержимым', () => {
    render(
      <Command>
        <CommandItem>Элемент</CommandItem>
      </Command>
    )
    expect(screen.getByText('Элемент')).toBeInTheDocument()
  })
})

describe('CommandShortcut', () => {
  it('отображает шорткат', () => {
    render(<CommandShortcut>Ctrl+K</CommandShortcut>)
    expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
  })
})

describe('CommandSeparator', () => {
  it('рендерится', () => {
    const { container } = render(
      <Command>
        <CommandSeparator />
      </Command>
    )
    const separator = container.querySelector('[class*="h-px"]')
    expect(separator).toBeInTheDocument()
  })
})
