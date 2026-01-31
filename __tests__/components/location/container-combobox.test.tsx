import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContainerCombobox from '@/components/location/container-combobox'

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
      {
        id: 3,
        name: '',
        entity_type: null,
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

describe('ContainerCombobox', () => {
  const mockOnContainerIdChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображается с дефолтным лейблом', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    expect(screen.getByText('Выберите контейнер')).toBeInTheDocument()
  })

  it('отображается с кастомным лейблом', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
        label="Кастомный лейбл"
      />
    )

    expect(screen.getByText('Кастомный лейбл')).toBeInTheDocument()
  })

  it('отображает placeholder когда ничего не выбрано', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('-- Выберите контейнер --')
  })

  it('отображает выбранный контейнер с именем', () => {
    render(
      <ContainerCombobox
        selectedContainerId="1"
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('Контейнер 1 (Коробка)')
  })

  it('отображает ID для контейнера без имени и типа', () => {
    render(
      <ContainerCombobox
        selectedContainerId="3"
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveTextContent('Контейнер #3')
  })

  it('открывает popover при клике', async () => {
    const user = userEvent.setup()
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Поиск контейнера...')).toBeInTheDocument()
    })
  })

  it('отображает список контейнеров в popover', async () => {
    const user = userEvent.setup()
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText('Контейнер 1 (Коробка)')).toBeInTheDocument()
      expect(screen.getByText('Контейнер 2 (Коробка)')).toBeInTheDocument()
      expect(screen.getByText('Контейнер #3')).toBeInTheDocument()
    })
  })

  it('вызывает onContainerIdChange при выборе контейнера', async () => {
    const user = userEvent.setup()
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.getByText('Контейнер 1 (Коробка)')).toBeInTheDocument()
    })

    const containerItem = screen.getByText('Контейнер 1 (Коробка)')
    await act(async () => {
      await user.click(containerItem)
    })

    expect(mockOnContainerIdChange).toHaveBeenCalledWith('1')
  })

  it('исключает контейнер из списка если указан excludeContainerId', async () => {
    const user = userEvent.setup()
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
        excludeContainerId={1}
      />
    )

    const button = screen.getByRole('combobox')
    await act(async () => {
      await user.click(button)
    })

    await waitFor(() => {
      expect(screen.queryByText('Контейнер 1 (Коробка)')).not.toBeInTheDocument()
      expect(screen.getByText('Контейнер 2 (Коробка)')).toBeInTheDocument()
      expect(screen.getByText('Контейнер #3')).toBeInTheDocument()
    })
  })

  it('disabled когда disabled=true', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
        disabled={true}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toBeDisabled()
  })

  it('disabled когда нет контейнеров', () => {
    const { useContainers } = require('@/lib/containers/hooks/use-containers')
    useContainers.mockReturnValueOnce({
      containers: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toBeDisabled()
  })

  it('отображает сообщение когда нет контейнеров', () => {
    const { useContainers } = require('@/lib/containers/hooks/use-containers')
    useContainers.mockReturnValueOnce({
      containers: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
      />
    )

    expect(screen.getByText(/Контейнеры не найдены. Сначала создайте контейнер./i)).toBeInTheDocument()
  })

  it('поддерживает required prop', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
        required={true}
      />
    )

    const label = screen.getByText('Выберите контейнер')
    expect(label).toBeInTheDocument()
  })

  it('использует кастомный id', () => {
    render(
      <ContainerCombobox
        selectedContainerId=""
        onContainerIdChange={mockOnContainerIdChange}
        id="custom-container-combobox"
      />
    )

    const button = screen.getByRole('combobox')
    expect(button).toHaveAttribute('id', 'custom-container-combobox-combobox')
  })
})
