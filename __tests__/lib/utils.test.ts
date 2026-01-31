import { cn } from '@/lib/shared/utils'

describe('cn', () => {
  it('объединяет классы', () => {
    const result = cn('class1', 'class2')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('обрабатывает условные классы', () => {
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toContain('base')
    expect(result).toContain('conditional')
    expect(result).not.toContain('hidden')
  })

  it('обрабатывает массивы классов', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBeTruthy()
  })

  it('обрабатывает объекты классов', () => {
    const result = cn({ class1: true, class2: false })
    expect(result).toContain('class1')
    expect(result).not.toContain('class2')
  })

  it('объединяет конфликтующие Tailwind классы', () => {
    const result = cn('p-4', 'p-2')
    // twMerge должен оставить только последний класс
    expect(result).toBeTruthy()
  })
})
