import { render, screen } from '@testing-library/react'
import { ListSkeleton } from '@/components/common/list-skeleton'

describe('ListSkeleton', () => {
  it('рендерится с дефолтными параметрами (table variant)', () => {
    render(<ListSkeleton />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })

  it('рендерится с table variant', () => {
    render(<ListSkeleton variant="table" />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })

  it('рендерится с grid variant', () => {
    const { container } = render(<ListSkeleton variant="grid" />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })

  it('использует кастомное количество строк', () => {
    render(<ListSkeleton rows={10} />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 10 body rows
    expect(rows.length).toBe(11)
  })

  it('использует кастомное количество колонок', () => {
    render(<ListSkeleton columns={3} />)
    const headerRow = screen.getAllByRole('columnheader')
    expect(headerRow.length).toBe(3)
  })

  it('рендерится с кастомными параметрами для grid', () => {
    const { container } = render(
      <ListSkeleton variant="grid" rows={4} />
    )
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards.length).toBe(4)
  })
})
