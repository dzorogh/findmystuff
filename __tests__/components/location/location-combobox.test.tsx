import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationCombobox from '@/components/location/location-combobox'

jest.mock('@/lib/rooms/hooks/use-rooms', () => ({
  useRooms: jest.fn(() => ({
    rooms: [
      { id: 1, name: 'Комната 1' },
      { id: 2, name: 'Комната 2' },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/lib/places/hooks/use-places', () => ({
  usePlaces: jest.fn(() => ({
    places: [
      { id: 1, name: 'Место 1', entity_type: { name: 'Место' } },
      { id: 2, name: 'Место 2', entity_type: { name: 'Место' } },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/lib/containers/hooks/use-containers', () => ({
  useContainers: jest.fn(() => ({
    containers: [
      {
        id: 1,
        name: 'Контейнер 1',
        entity_type: { name: 'Коробка' },
      },
      {
        id: 2,
        name: 'Контейнер 2',
        entity_type: { name: 'Коробка' },
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

describe('LocationCombobox', () => {
  const mockOnDestinationTypeChange = jest.fn()
  const mockOnDestinationIdChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображается с дефолтным лейблом', () => {
    render(
      <LocationCombobox
        destinationType={null}
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    expect(screen.getByText('Местоположение (необязательно)')).toBeInTheDocument()
  })

  it('отображается с кастомным лейблом', () => {
    render(
      <LocationCombobox
        destinationType={null}
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
        label="Кастомный лейбл"
      />
    )

    expect(screen.getByText('Кастомный лейбл')).toBeInTheDocument()
  })

  it('отображает кнопки выбора типа (showRoomFirst=true)', () => {
    render(
      <LocationCombobox
        destinationType={null}
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
        showRoomFirst={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    const roomButton = buttons.find(btn => btn.textContent?.includes('Помещение'))
    const placeButton = buttons.find(btn => btn.textContent?.includes('Место'))
    const containerButton = buttons.find(btn => btn.textContent?.includes('Контейнер'))

    expect(roomButton).toBeInTheDocument()
    expect(placeButton).toBeInTheDocument()
    expect(containerButton).toBeInTheDocument()
  })

  it('отображает кнопки выбора типа (showRoomFirst=false)', () => {
    render(
      <LocationCombobox
        destinationType={null}
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
        showRoomFirst={false}
      />
    )

    const buttons = screen.getAllByRole('button')
    const placeButton = buttons.find(btn => btn.textContent?.includes('Место'))
    const containerButton = buttons.find(btn => btn.textContent?.includes('Контейнер'))
    const roomButton = buttons.find(btn => btn.textContent?.includes('Помещение'))

    expect(placeButton).toBeInTheDocument()
    expect(containerButton).toBeInTheDocument()
    expect(roomButton).toBeInTheDocument()
  })

  it('вызывает onDestinationTypeChange при клике на кнопку типа', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType={null}
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const roomButton = screen.getByText('Помещение').closest('button')
    expect(roomButton).toBeInTheDocument()

    await act(async () => {
      await user.click(roomButton!)
    })

    expect(mockOnDestinationTypeChange).toHaveBeenCalledWith('room')
    expect(mockOnDestinationIdChange).toHaveBeenCalledWith('')
  })

  it('отображает combobox когда выбран тип помещения', () => {
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    expect(screen.getByText('Выберите помещение')).toBeInTheDocument()
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('-- Выберите помещение --')
  })

  it('отображает combobox когда выбран тип места', () => {
    render(
      <LocationCombobox
        destinationType="place"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    expect(screen.getByText('Выберите местоположение')).toBeInTheDocument()
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('-- Выберите местоположение --')
  })

  it('отображает combobox когда выбран тип контейнера', () => {
    render(
      <LocationCombobox
        destinationType="container"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    expect(screen.getByText('Выберите контейнер')).toBeInTheDocument()
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('-- Выберите контейнер --')
  })

  it('отображает выбранное помещение', () => {
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId="1"
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('Комната 1')
  })

  it('отображает выбранное место', () => {
    render(
      <LocationCombobox
        destinationType="place"
        selectedDestinationId="1"
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('Место 1 (Место)')
  })

  it('отображает выбранный контейнер с типом', () => {
    render(
      <LocationCombobox
        destinationType="container"
        selectedDestinationId="1"
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveTextContent('Контейнер 1 (Коробка)')
  })

  it('открывает popover при клике на combobox', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    await act(async () => {
      await user.click(combobox)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск помещение...')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('отображает список помещений в popover', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    await act(async () => {
      await user.click(combobox)
    })

    await waitFor(() => {
      expect(screen.getByText('Комната 1')).toBeInTheDocument()
      expect(screen.getByText('Комната 2')).toBeInTheDocument()
    })
  })

  it('вызывает onDestinationIdChange при выборе помещения', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    await act(async () => {
      await user.click(combobox)
    })

    await waitFor(() => {
      expect(screen.getByText('Комната 1')).toBeInTheDocument()
    })

    const roomItem = screen.getByText('Комната 1')
    await act(async () => {
      await user.click(roomItem)
    })

    expect(mockOnDestinationIdChange).toHaveBeenCalledWith('1')
  })

  it('вызывает onDestinationIdChange при выборе места', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType="place"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    await act(async () => {
      await user.click(combobox)
    })

    await waitFor(() => {
      expect(screen.getByText('Место 1 (Место)')).toBeInTheDocument()
    })

    const placeItem = screen.getByText('Место 1 (Место)')
    await act(async () => {
      await user.click(placeItem)
    })

    expect(mockOnDestinationIdChange).toHaveBeenCalledWith('1')
  })

  it('вызывает onDestinationIdChange при выборе контейнера', async () => {
    const user = userEvent.setup()
    render(
      <LocationCombobox
        destinationType="container"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    await act(async () => {
      await user.click(combobox)
    })

    await waitFor(() => {
      expect(screen.getByText(/Контейнер 1 \(Коробка\)/)).toBeInTheDocument()
    })

    const containerItem = screen.getByText(/Контейнер 1 \(Коробка\)/)
    await act(async () => {
      await user.click(containerItem)
    })

    expect(mockOnDestinationIdChange).toHaveBeenCalledWith('1')
  })

  it('disabled когда disabled=true', () => {
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
        disabled={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeDisabled()
    buttons.forEach(button => {
      if (button !== combobox) {
        expect(button).toBeDisabled()
      }
    })
  })

  it('disabled combobox когда нет элементов', () => {
    const { useRooms } = require('@/lib/rooms/hooks/use-rooms')
    useRooms.mockReturnValueOnce({
      rooms: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeDisabled()
  })

  it('отображает сообщение когда нет элементов', () => {
    const { useRooms } = require('@/lib/rooms/hooks/use-rooms')
    useRooms.mockReturnValueOnce({
      rooms: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
      />
    )

    expect(screen.getByText(/Помещения не найдены/i)).toBeInTheDocument()
  })

  it('использует кастомный id', () => {
    render(
      <LocationCombobox
        destinationType="room"
        selectedDestinationId=""
        onDestinationTypeChange={mockOnDestinationTypeChange}
        onDestinationIdChange={mockOnDestinationIdChange}
        id="custom-location-combobox"
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('id', 'custom-location-combobox-combobox')
  })
})
