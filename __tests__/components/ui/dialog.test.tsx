import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog', () => {
  it('не отображается, когда open = false', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Тест</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByText('Тест')).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Тест Dialog</DialogTitle>
            <DialogDescription>Описание</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await waitFor(() => {
      expect(screen.getByText('Тест Dialog')).toBeInTheDocument()
      expect(screen.getByText('Описание')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('отображает DialogHeader с правильными классами', async () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader className="custom-class">
            <DialogTitle>Заголовок</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await waitFor(() => {
      const header = screen.getByText('Заголовок').closest('div')
      expect(header).toHaveClass('custom-class')
    }, { timeout: 2000 })
  })

  it('отображает DialogFooter', async () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogFooter>
            <Button>Кнопка</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await waitFor(() => {
      expect(screen.getByText('Кнопка')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('вызывает onOpenChange при закрытии', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()

    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent>
          <DialogTitle>Тест</DialogTitle>
        </DialogContent>
      </Dialog>
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

  it('работает с DialogTrigger', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()

    render(
      <Dialog onOpenChange={mockOnOpenChange}>
        <DialogTrigger asChild>
          <Button>Открыть</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Диалог</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    const triggerButton = screen.getByText('Открыть')
    await user.click(triggerButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(true)
    }, { timeout: 2000 })
  })
})
