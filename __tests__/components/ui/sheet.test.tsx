import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

describe('Sheet', () => {
  it('не отображается, когда open = false', () => {
    render(
      <Sheet open={false}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Тест</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
    expect(screen.queryByText('Тест')).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <Sheet open={true}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Тест Sheet</SheetTitle>
            <SheetDescription>Описание</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      expect(screen.getByText('Тест Sheet')).toBeInTheDocument()
      expect(screen.getByText('Описание')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('отображает SheetHeader с правильными классами', async () => {
    render(
      <Sheet open={true}>
        <SheetContent>
          <SheetHeader className="custom-class">
            <SheetTitle>Заголовок</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      const header = screen.getByText('Заголовок').closest('div')
      expect(header).toHaveClass('custom-class')
    }, { timeout: 2000 })
  })

  it('отображает SheetFooter', async () => {
    render(
      <Sheet open={true}>
        <SheetContent>
          <SheetFooter>
            <Button>Кнопка</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      expect(screen.getByText('Кнопка')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('поддерживает разные стороны (side)', async () => {
    const { rerender } = render(
      <Sheet open={true}>
        <SheetContent side="right">
          <SheetTitle>Справа</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      expect(screen.getByText('Справа')).toBeInTheDocument()
    }, { timeout: 2000 })

    rerender(
      <Sheet open={true}>
        <SheetContent side="left">
          <SheetTitle>Слева</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      expect(screen.getByText('Слева')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('вызывает onOpenChange при закрытии', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()

    render(
      <Sheet open={true} onOpenChange={mockOnOpenChange}>
        <SheetContent>
          <SheetTitle>Тест</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    await waitFor(() => {
      expect(screen.getByText('Тест')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Ищем кнопку закрытия
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    }, { timeout: 2000 })
  })
})
