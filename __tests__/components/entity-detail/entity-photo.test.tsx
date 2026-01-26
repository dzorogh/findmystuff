import { render, screen } from '@testing-library/react'
import { EntityPhoto } from '@/components/entity-detail/entity-photo'
import { Package } from 'lucide-react'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('EntityPhoto', () => {
  const defaultProps = {
    photoUrl: null,
    name: 'Тестовая вещь',
    defaultIcon: <Package className="h-6 w-6" />,
  }

  it('отображает дефолтную иконку, если photoUrl не указан', () => {
    const { container } = render(<EntityPhoto {...defaultProps} />)
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('отображает фото, если photoUrl указан', () => {
    render(
      <EntityPhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
      />
    )
    const img = screen.getByAltText('Тестовая вещь')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('использует small size', () => {
    const { container } = render(
      <EntityPhoto {...defaultProps} size="small" />
    )
    const photo = container.querySelector('.h-16')
    expect(photo).toBeInTheDocument()
  })

  it('использует medium size по умолчанию', () => {
    const { container } = render(<EntityPhoto {...defaultProps} />)
    const photo = container.querySelector('.w-24')
    expect(photo).toBeInTheDocument()
  })

  it('использует large size', () => {
    const { container } = render(
      <EntityPhoto {...defaultProps} size="large" />
    )
    const photo = container.querySelector('.w-full')
    expect(photo).toBeInTheDocument()
  })

  it('использует video aspectRatio', () => {
    render(
      <EntityPhoto
        {...defaultProps}
        aspectRatio="video"
        photoUrl="https://example.com/photo.jpg"
      />
    )
    expect(screen.getByText(/фотография/i)).toBeInTheDocument()
  })

  it('отображает сообщение об отсутствии фото в video режиме', () => {
    render(<EntityPhoto {...defaultProps} aspectRatio="video" />)
    expect(screen.getByText(/фотография не загружена/i)).toBeInTheDocument()
  })
})
