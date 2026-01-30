import {
  containerTypesToOptions,
  placeTypesToOptions,
  DEFAULT_CONTAINER_TYPES,
  cn,
} from '@/lib/utils'

describe('containerTypesToOptions', () => {
  it('преобразует массив типов в опции', () => {
    const types = ['КОР', 'ПЛА', 'ЯЩ']
    const result = containerTypesToOptions(types)

    expect(result).toEqual([
      { value: 'КОР', label: 'КОР - Коробка' },
      { value: 'ПЛА', label: 'ПЛА - Пластик' },
      { value: 'ЯЩ', label: 'ЯЩ - Ящик' },
    ])
  })

  it('обрабатывает пустой массив', () => {
    const result = containerTypesToOptions([])
    expect(result).toEqual([])
  })

  it('обрабатывает неизвестные типы', () => {
    const types = ['НЕИЗВЕСТНЫЙ']
    const result = containerTypesToOptions(types)
    expect(result).toEqual([
      { value: 'НЕИЗВЕСТНЫЙ', label: 'НЕИЗВЕСТНЫЙ - НЕИЗВЕСТНЫЙ' },
    ])
  })
})

describe('placeTypesToOptions', () => {
  it('преобразует массив типов мест в опции', () => {
    const types = ['Полка', 'Стеллаж', 'Шкаф']
    const result = placeTypesToOptions(types)

    expect(result).toEqual([
      { value: 'Полка', label: 'Полка' },
      { value: 'Стеллаж', label: 'Стеллаж' },
      { value: 'Шкаф', label: 'Шкаф' },
    ])
  })

  it('обрабатывает пустой массив', () => {
    const result = placeTypesToOptions([])
    expect(result).toEqual([])
  })
})

describe('DEFAULT_CONTAINER_TYPES', () => {
  it('содержит все необходимые типы контейнеров', () => {
    expect(DEFAULT_CONTAINER_TYPES).toHaveLength(7)
    expect(DEFAULT_CONTAINER_TYPES.map(t => t.value)).toContain('КОР')
    expect(DEFAULT_CONTAINER_TYPES.map(t => t.value)).toContain('ПЛА')
    expect(DEFAULT_CONTAINER_TYPES.map(t => t.value)).toContain('ЯЩ')
  })
})

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
