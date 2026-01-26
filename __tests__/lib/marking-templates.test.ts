import { MARKING_TEMPLATES } from '@/lib/marking-templates'

describe('MARKING_TEMPLATES', () => {
  it('содержит шаблоны маркировки', () => {
    expect(MARKING_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('каждый шаблон имеет все необходимые поля', () => {
    MARKING_TEMPLATES.forEach((template) => {
      expect(template).toHaveProperty('value')
      expect(template).toHaveProperty('label')
      expect(template).toHaveProperty('example')
      expect(typeof template.value).toBe('string')
      expect(typeof template.label).toBe('string')
      expect(typeof template.example).toBe('string')
    })
  })

  it('содержит шаблоны с дефисом', () => {
    const templatesWithDash = MARKING_TEMPLATES.filter((t) =>
      t.value.includes('-')
    )
    expect(templatesWithDash.length).toBeGreaterThan(0)
  })

  it('содержит шаблоны с квадратными скобками', () => {
    const templatesWithBrackets = MARKING_TEMPLATES.filter((t) =>
      t.value.includes('[')
    )
    expect(templatesWithBrackets.length).toBeGreaterThan(0)
  })

  it('содержит шаблоны с номером перед типом', () => {
    const templatesWithNumberFirst = MARKING_TEMPLATES.filter((t) =>
      t.value.startsWith('{NUMBER')
    )
    expect(templatesWithNumberFirst.length).toBeGreaterThan(0)
  })
})
