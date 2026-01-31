import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomCombobox from '@/components/location/room-combobox'

jest.mock('@/lib/rooms/hooks/use-rooms', () => ({
  useRooms: jest.fn(() => ({
    rooms: [
      { id: 1, name: 'Комната 1' },
      { id: 2, name: 'Комната 2' },
      { id: 3, name: '' }, // Комната без имени
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

describe('RoomCombobox', () => {
  const mockOnRoomIdChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображается с дефолтным лейблом', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    expect(screen.getByText('Выберите помещение')).toBeInTheDocument()
  })

  it('отображается с кастомным лейблом', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
        label="Кастомный лейбл"
      />
    )

    expect(screen.getByText('Кастомный лейбл')).toBeInTheDocument()
  })

  it('отображает placeholder когда ничего не выбрано', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('-- Выберите помещение --')
  })

  it('отображает выбранное помещение', () => {
    render(
      <RoomCombobox
        selectedRoomId="1"
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('Комната 1')
  })

  it('отображает ID для помещения без имени', () => {
    render(
      <RoomCombobox
        selectedRoomId="3"
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('Помещение #3')
  })

  it('открывает popover при клике', async () => {
    const user = userEvent.setup()
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск помещения...')).toBeInTheDocument()
    })
  })

  it('отображает список помещений в popover', async () => {
    const user = userEvent.setup()
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText('Комната 1')).toBeInTheDocument()
      expect(screen.getByText('Комната 2')).toBeInTheDocument()
      expect(screen.getByText('Помещение #3')).toBeInTheDocument()
    })
  })

  it('вызывает onRoomIdChange при выборе помещения', async () => {
    const user = userEvent.setup()
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText('Комната 1')).toBeInTheDocument()
    })

    const roomItem = screen.getByText('Комната 1')
    await act(async () => {
      await user.click(roomItem)
    })

    expect(mockOnRoomIdChange).toHaveBeenCalledWith('1')
  })

  it('отображает галочку для выбранного помещения', async () => {
    const user = userEvent.setup()
    render(
      <RoomCombobox
        selectedRoomId="1"
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      // Ищем элемент в списке (не в кнопке)
      const options = screen.getAllByRole('option')
      const selectedOption = options.find(opt => opt.textContent?.includes('Комната 1'))
      expect(selectedOption).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('disabled когда disabled=true', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
        disabled={true}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toBeDisabled()
  })

  it('disabled когда нет помещений', () => {
    const { useRooms } = require('@/lib/rooms/hooks/use-rooms')
    useRooms.mockReturnValueOnce({
      rooms: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toBeDisabled()
  })

  it('отображает сообщение когда нет помещений', () => {
    const { useRooms } = require('@/lib/rooms/hooks/use-rooms')
    useRooms.mockReturnValueOnce({
      rooms: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
      />
    )

    expect(screen.getByText(/Помещения не найдены. Сначала создайте помещение./i)).toBeInTheDocument()
  })

  it('поддерживает required prop', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
        required={true}
      />
    )

    const label = screen.getByText('Выберите помещение')
    expect(label).toBeInTheDocument()
  })

  it('использует кастомный id', () => {
    render(
      <RoomCombobox
        selectedRoomId=""
        onRoomIdChange={mockOnRoomIdChange}
        id="custom-room-combobox"
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveAttribute('id', 'custom-room-combobox-combobox')
  })
})
