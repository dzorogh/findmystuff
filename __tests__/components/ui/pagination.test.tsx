import { render, screen } from '@testing-library/react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

describe('Pagination', () => {
  it('рендерится с содержимым', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(
      <Pagination className="custom-pagination">
        <PaginationContent />
      </Pagination>
    )
    const pagination = container.querySelector('.custom-pagination')
    expect(pagination).toBeInTheDocument()
  })
})

describe('PaginationContent', () => {
  it('рендерится с элементами', () => {
    render(
      <PaginationContent>
        <PaginationItem>
          <PaginationLink href="/page/1">1</PaginationLink>
        </PaginationItem>
      </PaginationContent>
    )

    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

describe('PaginationLink', () => {
  it('отображает активную ссылку', () => {
    render(<PaginationLink href="/page/1" isActive>1</PaginationLink>)
    const link = screen.getByText('1')
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('создает ссылку с href', () => {
    render(<PaginationLink href="/page/2">2</PaginationLink>)
    const link = screen.getByText('2')
    expect(link).toHaveAttribute('href', '/page/2')
  })
})

describe('PaginationPrevious', () => {
  it('отображает кнопку "Предыдущая"', () => {
    render(<PaginationPrevious href="/page/1" />)
    expect(screen.getByText('Предыдущая')).toBeInTheDocument()
  })
})

describe('PaginationNext', () => {
  it('отображает кнопку "Следующая"', () => {
    render(<PaginationNext href="/page/2" />)
    expect(screen.getByText('Следующая')).toBeInTheDocument()
  })
})

describe('PaginationEllipsis', () => {
  it('рендерится', () => {
    const { container } = render(<PaginationEllipsis />)
    const ellipsis = container.querySelector('span[aria-hidden="true"]')
    expect(ellipsis).toBeInTheDocument()
  })
})
