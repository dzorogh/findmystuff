import { PhotoApi } from '@/lib/api-client/photo'

global.fetch = jest.fn()

describe('PhotoApi', () => {
  const photoApi = new PhotoApi()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает фотографию', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockUrl = 'https://example.com/photo.jpg'

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: mockUrl }),
    })

    const response = await photoApi.uploadPhoto(mockFile)

    expect(response.data).toBeDefined()
    expect(response.data?.url).toBe(mockUrl)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/upload-photo'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    )
  })

  it('обрабатывает ошибку загрузки', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Файл слишком большой' }),
    })

    await expect(photoApi.uploadPhoto(mockFile)).rejects.toThrow(
      'Файл слишком большой'
    )
  })

  it('обрабатывает ошибку без JSON ответа', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    await expect(photoApi.uploadPhoto(mockFile)).rejects.toThrow(
      'Ошибка сервера: 500 Internal Server Error'
    )
  })

  it('обрабатывает отсутствие URL в ответе', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await expect(photoApi.uploadPhoto(mockFile)).rejects.toThrow(
      'Сервер не вернул URL загруженного файла'
    )
  })
})
