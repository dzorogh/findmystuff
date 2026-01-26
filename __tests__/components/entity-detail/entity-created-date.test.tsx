import { render, screen } from '@testing-library/react'
import { EntityCreatedDate } from '@/components/entity-detail/entity-created-date'

describe('EntityCreatedDate', () => {
  it('отображает дату создания', () => {
    const createdAt = '2024-01-15T10:30:00Z'
    render(<EntityCreatedDate createdAt={createdAt} />)

    expect(screen.getByText(/создан/i)).toBeInTheDocument()
    expect(screen.getByText(/2024/i)).toBeInTheDocument()
  })

  it('использует кастомный label', () => {
    const createdAt = '2024-01-15T10:30:00Z'
    render(<EntityCreatedDate createdAt={createdAt} label="Добавлено" />)

    expect(screen.getByText(/добавлено/i)).toBeInTheDocument()
  })

  it('форматирует дату в русском формате', () => {
    const createdAt = '2024-01-15T10:30:00Z'
    render(<EntityCreatedDate createdAt={createdAt} />)

    const text = screen.getByText(/создан/i).textContent
    expect(text).toMatch(/2024/)
    expect(text).toMatch(/январ/i)
  })
})
