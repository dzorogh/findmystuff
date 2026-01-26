import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('рендерится с текстом', () => {
    render(<Badge>Тестовый бейдж</Badge>)
    expect(screen.getByText('Тестовый бейдж')).toBeInTheDocument()
  })

  it('применяет default variant по умолчанию', () => {
    const { container } = render(<Badge>Тест</Badge>)
    const badge = container.querySelector('.bg-primary')
    expect(badge).toBeInTheDocument()
  })

  it('применяет secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Тест</Badge>)
    const badge = container.querySelector('.bg-secondary')
    expect(badge).toBeInTheDocument()
  })

  it('применяет destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Тест</Badge>)
    const badge = container.querySelector('.bg-destructive')
    expect(badge).toBeInTheDocument()
  })

  it('применяет outline variant', () => {
    const { container } = render(<Badge variant="outline">Тест</Badge>)
    const badge = container.querySelector('.text-foreground')
    expect(badge).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Badge className="custom-badge">Тест</Badge>)
    const badge = container.querySelector('.custom-badge')
    expect(badge).toBeInTheDocument()
  })
})
