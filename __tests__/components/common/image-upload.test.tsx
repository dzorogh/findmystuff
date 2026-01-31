import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUpload from '@/components/common/image-upload'
import { photoApi } from '@/lib/shared/api/photo'

jest.mock('@/lib/shared/api/photo')
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // Убираем fill и unoptimized из props, так как это не валидные HTML атрибуты
    const { fill, unoptimized, ...restProps } = props
    return <img src={src} alt={alt} {...restProps} />
  },
}))

// Мокируем FileReader
global.FileReader = class FileReader {
  result: string | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,test'
    if (this.onloadend) {
      this.onloadend(new ProgressEvent('loadend'))
    }
  }
} as any

describe('ImageUpload', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('отображает компонент загрузки', () => {
    render(<ImageUpload onChange={mockOnChange} />)
    expect(screen.getByText(/фотография/i)).toBeInTheDocument()
  })

  it('отображает превью, если value указан', () => {
    render(
      <ImageUpload
        value="https://example.com/image.jpg"
        onChange={mockOnChange}
      />
    )
    const img = screen.getByAltText('Превью')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('отображает сообщение об отсутствии фото', () => {
    render(<ImageUpload onChange={mockOnChange} />)
    expect(screen.getByText(/нет фотографии/i)).toBeInTheDocument()
  })

  it('загружает фото при выборе файла', async () => {
    const user = userEvent.setup()
    const mockUploadPhoto = jest.fn().mockResolvedValue({
      data: { url: 'https://example.com/uploaded.jpg' },
    })
    ;(photoApi.uploadPhoto as jest.Mock).mockImplementation(mockUploadPhoto)

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const { container } = render(<ImageUpload onChange={mockOnChange} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledWith(file)
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('https://example.com/uploaded.jpg')
    }, { timeout: 2000 })
  })

  it('проверяет тип файла', async () => {
    const user = userEvent.setup()
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const { container } = render(<ImageUpload onChange={mockOnChange} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    
    // Используем Object.defineProperty для установки files
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    })
    
    // Создаем событие change
    const changeEvent = new Event('change', { bubbles: true })
    input.dispatchEvent(changeEvent)

    // alert вызывается синхронно в handleFileSelect
    expect(alertSpy).toHaveBeenCalledWith('Файл должен быть изображением')
    expect(mockOnChange).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })

  it('проверяет размер файла', async () => {
    const user = userEvent.setup()
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    // Создаем файл больше 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    })
    const { container } = render(<ImageUpload onChange={mockOnChange} />)

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, largeFile)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Размер файла не должен превышать 10MB'
      )
    })

    alertSpy.mockRestore()
  })

  it('удаляет фото при клике на кнопку удаления', async () => {
    const user = userEvent.setup()
    render(
      <ImageUpload
        value="https://example.com/image.jpg"
        onChange={mockOnChange}
      />
    )

    const removeButton = screen.getAllByRole('button').find((btn) =>
      btn.querySelector('svg')
    )
    if (removeButton) {
      await user.click(removeButton)
      expect(mockOnChange).toHaveBeenCalledWith(null)
    }
  })

  it('отключается, когда disabled = true', () => {
    const { container } = render(
      <ImageUpload onChange={mockOnChange} disabled={true} />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('обрабатывает ошибку загрузки', async () => {
    const user = userEvent.setup()
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const mockUploadPhoto = jest
      .fn()
      .mockRejectedValue(new Error('Ошибка загрузки'))
    ;(photoApi.uploadPhoto as jest.Mock) = mockUploadPhoto

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const { container } = render(
      <ImageUpload value="old.jpg" onChange={mockOnChange} />
    )

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => {
      await user.upload(input, file)
    })

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled()
    }, { timeout: 3000 })

    alertSpy.mockRestore()
  })
})
