import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

describe('Table', () => {
  it('рендерится с содержимым', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Ячейка</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Ячейка')).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Table className="custom-table" />)
    const table = container.querySelector('.custom-table')
    expect(table).toBeInTheDocument()
  })
})

describe('TableHeader', () => {
  it('рендерится с содержимым', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Заголовок</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    )
    expect(screen.getByText('Заголовок')).toBeInTheDocument()
  })
})

describe('TableBody', () => {
  it('рендерится с содержимым', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Данные</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Данные')).toBeInTheDocument()
  })
})

describe('TableFooter', () => {
  it('рендерится с содержимым', () => {
    render(
      <Table>
        <TableFooter>
          <TableRow>
            <TableCell>Итого</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    expect(screen.getByText('Итого')).toBeInTheDocument()
  })
})

describe('TableCaption', () => {
  it('рендерится с текстом', () => {
    render(
      <Table>
        <TableCaption>Описание таблицы</TableCaption>
      </Table>
    )
    expect(screen.getByText('Описание таблицы')).toBeInTheDocument()
  })
})

describe('Table composition', () => {
  it('работает в составе полной таблицы', () => {
    render(
      <Table>
        <TableCaption>Таблица данных</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Колонка 1</TableHead>
            <TableHead>Колонка 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Данные 1</TableCell>
            <TableCell>Данные 2</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Итого</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )

    expect(screen.getByText('Таблица данных')).toBeInTheDocument()
    expect(screen.getByText('Колонка 1')).toBeInTheDocument()
    expect(screen.getByText('Данные 1')).toBeInTheDocument()
    expect(screen.getByText('Итого')).toBeInTheDocument()
  })
})
