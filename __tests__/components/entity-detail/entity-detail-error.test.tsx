import { render, screen } from '@testing-library/react'
import { EntityDetailError } from '@/components/entity-detail/entity-detail-error'

describe('EntityDetailError', () => {
  it('отображает сообщение об ошибке', () => {
    render(<EntityDetailError error="Ошибка загрузки" entityName="Вещь" />)
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
  })

  it('отображает дефолтное сообщение, если error не указан', () => {
    render(<EntityDetailError error={null} entityName="Вещь" />)
    expect(screen.getByText(/вещь не найден/i)).toBeInTheDocument()
  })

  it('использует переданное имя сущности', () => {
    render(<EntityDetailError error={null} entityName="Контейнер" />)
    expect(screen.getByText(/контейнер не найден/i)).toBeInTheDocument()
  })
})
