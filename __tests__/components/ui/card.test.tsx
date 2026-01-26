import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

describe('Card', () => {
  it('рендерится с содержимым', () => {
    render(
      <Card>
        <div>Содержимое карточки</div>
      </Card>
    )
    expect(screen.getByText('Содержимое карточки')).toBeInTheDocument()
  })

  it('применяет кастомный className', () => {
    const { container } = render(<Card className="custom-card" />)
    const card = container.querySelector('.custom-card')
    expect(card).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('рендерится с содержимым', () => {
    render(
      <CardHeader>
        <div>Заголовок карточки</div>
      </CardHeader>
    )
    expect(screen.getByText('Заголовок карточки')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('рендерится с текстом', () => {
    render(<CardTitle>Название карточки</CardTitle>)
    expect(screen.getByText('Название карточки')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('рендерится с текстом', () => {
    render(<CardDescription>Описание карточки</CardDescription>)
    expect(screen.getByText('Описание карточки')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('рендерится с содержимым', () => {
    render(
      <CardContent>
        <div>Содержимое карточки</div>
      </CardContent>
    )
    expect(screen.getByText('Содержимое карточки')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('рендерится с содержимым', () => {
    render(
      <CardFooter>
        <div>Футер карточки</div>
      </CardFooter>
    )
    expect(screen.getByText('Футер карточки')).toBeInTheDocument()
  })
})

describe('Card composition', () => {
  it('работает в составе полной карточки', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Заголовок</CardTitle>
          <CardDescription>Описание</CardDescription>
        </CardHeader>
        <CardContent>Содержимое</CardContent>
        <CardFooter>Футер</CardFooter>
      </Card>
    )

    expect(screen.getByText('Заголовок')).toBeInTheDocument()
    expect(screen.getByText('Описание')).toBeInTheDocument()
    expect(screen.getByText('Содержимое')).toBeInTheDocument()
    expect(screen.getByText('Футер')).toBeInTheDocument()
  })
})
