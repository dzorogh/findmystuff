import { render, screen } from '@testing-library/react'
import { EntityContentGrid } from '@/components/entity-detail/entity-content-grid'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

describe('EntityContentGrid', () => {
  it('отображает пустое сообщение, если items пуст', () => {
    render(
      <EntityContentGrid
        items={[]}
        emptyMessage="Нет элементов"
        entityType="items"
      />
    )
    expect(screen.getByText('Нет элементов')).toBeInTheDocument()
  })

  it('отображает сетку элементов', () => {
    const items = [
      { id: 1, name: 'Вещь 1', photo_url: null, created_at: '2024-01-01' },
      { id: 2, name: 'Вещь 2', photo_url: null, created_at: '2024-01-02' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="items"
      />
    )

    expect(screen.getByText('Вещь 1')).toBeInTheDocument()
    expect(screen.getByText('Вещь 2')).toBeInTheDocument()
  })

  it('отображает заголовок с количеством', () => {
    const items = [
      { id: 1, name: 'Вещь 1', photo_url: null, created_at: '2024-01-01' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="items"
        title="Вещи"
      />
    )

    expect(screen.getByText(/вещи \(1\)/i)).toBeInTheDocument()
  })

  it('отображает фото, если photo_url указан', () => {
    const items = [
      {
        id: 1,
        name: 'Вещь 1',
        photo_url: 'https://example.com/photo.jpg',
        created_at: '2024-01-01',
      },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="items"
      />
    )

    const img = screen.getByAltText('Вещь 1')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('использует дефолтное название, если name не указан', () => {
    const items = [
      { id: 1, name: null, photo_url: null, created_at: '2024-01-01' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="items"
      />
    )

    expect(screen.getByText(/вещь #1/i)).toBeInTheDocument()
  })

  it('работает с containers', () => {
    const items = [
      { id: 1, name: 'Контейнер 1', photo_url: null, created_at: '2024-01-01' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="containers"
      />
    )

    expect(screen.getByText('Контейнер 1')).toBeInTheDocument()
  })

  it('работает с places', () => {
    const items = [
      { id: 1, name: 'Место 1', photo_url: null, created_at: '2024-01-01' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="places"
      />
    )

    expect(screen.getByText('Место 1')).toBeInTheDocument()
  })

  it('создает правильные ссылки', () => {
    const items = [
      { id: 1, name: 'Вещь 1', photo_url: null, created_at: '2024-01-01' },
    ]

    render(
      <EntityContentGrid
        items={items}
        emptyMessage="Нет элементов"
        entityType="items"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/items/1')
  })
})
