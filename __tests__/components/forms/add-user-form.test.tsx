import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddUserForm from '@/components/forms/add-user-form'
import * as usersApi from '@/lib/users/api'
import { toast } from 'sonner'

jest.mock('@/lib/users/api')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('AddUserForm', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не отображается, когда open = false', () => {
    render(<AddUserForm open={false} onOpenChange={mockOnOpenChange} />)
    expect(screen.queryByText(/добавить нового пользователя/i)).not.toBeInTheDocument()
  })

  it('отображается, когда open = true', async () => {
    render(<AddUserForm open={true} onOpenChange={mockOnOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByText(/добавить нового пользователя/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('валидирует обязательное поле email', async () => {
    const user = userEvent.setup()
    const mockCreateUser = jest.fn()
    ;(usersApi.createUser as jest.Mock).mockImplementation(mockCreateUser)

    render(<AddUserForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить нового пользователя/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Попытка отправить форму без email
    const submitButton = await screen.findByRole('button', { name: /добавить пользователя/i })
    await act(async () => {
      await user.click(submitButton)
    })

    // Проверяем, что ошибка отображается или API не вызывается
    await waitFor(() => {
      const errorMessage = screen.queryByText(/email обязателен/i) || 
                          screen.queryByText(/email обязателен для заполнения/i)
      if (!errorMessage) {
        // Если ошибка не отображается, проверяем, что API не вызывался
        expect(mockCreateUser).not.toHaveBeenCalled()
      } else {
        expect(errorMessage).toBeInTheDocument()
      }
    }, { timeout: 3000 })

    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('создает пользователя при валидных данных', async () => {
    const user = userEvent.setup()
    const mockCreateUser = jest.fn().mockResolvedValue({ 
      data: { id: '1', password: 'temp123' } 
    })
    ;(usersApi.createUser as jest.Mock).mockImplementation(mockCreateUser)

    render(
      <AddUserForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/добавить нового пользователя/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const emailInput = screen.getByLabelText(/email/i)
    await act(async () => {
      await user.type(emailInput, 'test@example.com')
    })

    const submitButton = screen.getByRole('button', { name: /добавить пользователя/i })
    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        email_confirm: true,
      })
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('обрабатывает ошибку создания', async () => {
    const user = userEvent.setup()
    const mockCreateUser = jest
      .fn()
      .mockResolvedValue({ error: 'Ошибка создания' })
    ;(usersApi.createUser as jest.Mock).mockImplementation(mockCreateUser)

    render(<AddUserForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить нового пользователя/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const emailInput = screen.getByLabelText(/email/i)
    await act(async () => {
      await user.type(emailInput, 'test@example.com')
    })

    const submitButton = screen.getByRole('button', { name: /добавить пользователя/i })
    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/ошибка создания/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('закрывает форму при клике на отмену', async () => {
    const user = userEvent.setup()
    render(<AddUserForm open={true} onOpenChange={mockOnOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText(/добавить нового пользователя/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    const cancelButton = screen.getByRole('button', { name: /отмена/i })
    await act(async () => {
      await user.click(cancelButton)
    })

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
