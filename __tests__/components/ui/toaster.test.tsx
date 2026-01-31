import { render, screen } from '@testing-library/react'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/lib/app/hooks/use-toast'

jest.mock('@/lib/app/hooks/use-toast', () => ({
  useToast: jest.fn(),
}))

jest.mock('@/components/ui/toast', () => ({
  Toast: ({ children }: any) => <div data-testid="toast">{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Закрыть</button>,
  ToastDescription: ({ children }: any) => (
    <div data-testid="toast-description">{children}</div>
  ),
  ToastTitle: ({ children }: any) => (
    <div data-testid="toast-title">{children}</div>
  ),
  ToastProvider: ({ children }: any) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  ToastViewport: () => <div data-testid="toast-viewport" />,
}))

describe('Toaster', () => {
  it('рендерится без тостов', () => {
    ;(useToast as jest.Mock).mockReturnValue({ toasts: [] })

    render(<Toaster />)

    expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
  })

  it('отображает тосты', () => {
    ;(useToast as jest.Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Успех',
          description: 'Операция выполнена',
        },
      ],
    })

    render(<Toaster />)

    expect(screen.getByText('Успех')).toBeInTheDocument()
    expect(screen.getByText('Операция выполнена')).toBeInTheDocument()
  })

  it('отображает тост без описания', () => {
    ;(useToast as jest.Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Успех',
        },
      ],
    })

    render(<Toaster />)

    expect(screen.getByText('Успех')).toBeInTheDocument()
    expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument()
  })

  it('отображает несколько тостов', () => {
    ;(useToast as jest.Mock).mockReturnValue({
      toasts: [
        { id: '1', title: 'Тост 1' },
        { id: '2', title: 'Тост 2' },
      ],
    })

    render(<Toaster />)

    expect(screen.getByText('Тост 1')).toBeInTheDocument()
    expect(screen.getByText('Тост 2')).toBeInTheDocument()
  })
})
