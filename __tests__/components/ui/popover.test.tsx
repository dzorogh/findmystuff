import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

describe('Popover', () => {
  it('не отображается, когда open = false', () => {
    render(
      <Popover open={false}>
        <PopoverTrigger asChild>
          <Button>Открыть</Button>
        </PopoverTrigger>
        <PopoverContent>Контент</PopoverContent>
      </Popover>
    )
    expect(screen.queryByText('Контент')).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    await act(async () => {
      render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <Button>Открыть</Button>
          </PopoverTrigger>
          <PopoverContent>Контент Popover</PopoverContent>
        </Popover>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Контент Popover')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('вызывает onOpenChange при открытии через trigger', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()

    await act(async () => {
      render(
        <Popover onOpenChange={mockOnOpenChange}>
          <PopoverTrigger asChild>
            <Button>Открыть</Button>
          </PopoverTrigger>
          <PopoverContent>Контент</PopoverContent>
        </Popover>
      )
    })

    const triggerButton = screen.getByText('Открыть')
    await act(async () => {
      await user.click(triggerButton)
    })

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(true)
    }, { timeout: 2000 })
  })

  it('поддерживает align prop', async () => {
    await act(async () => {
      render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <Button>Открыть</Button>
          </PopoverTrigger>
          <PopoverContent align="start">Контент</PopoverContent>
        </Popover>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Контент')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('поддерживает sideOffset prop', async () => {
    await act(async () => {
      render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <Button>Открыть</Button>
          </PopoverTrigger>
          <PopoverContent sideOffset={10}>Контент</PopoverContent>
        </Popover>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Контент')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('вызывает onOpenChange при закрытии', async () => {
    const user = userEvent.setup()
    const mockOnOpenChange = jest.fn()

    await act(async () => {
      render(
        <Popover open={true} onOpenChange={mockOnOpenChange}>
          <PopoverTrigger asChild>
            <Button>Открыть</Button>
          </PopoverTrigger>
          <PopoverContent>Контент</PopoverContent>
        </Popover>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Контент')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Клик вне popover должен закрыть его
    await act(async () => {
      await user.click(document.body)
    })

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    }, { timeout: 2000 })
  })
})
