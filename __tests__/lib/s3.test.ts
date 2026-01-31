import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn((params) => params),
}))

describe('S3', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    mockSend.mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('BUCKET_NAME', () => {
    it('использует значение из переменной окружения', () => {
      process.env.S3_BUCKET_NAME = 'custom-bucket'
      jest.resetModules()
      const { BUCKET_NAME: newBucketName } = require('@/lib/shared/storage')
      expect(newBucketName).toBe('custom-bucket')
    })

    it('использует значение по умолчанию если переменная не установлена', () => {
      delete process.env.S3_BUCKET_NAME
      jest.resetModules()
      const { BUCKET_NAME: defaultBucketName } = require('@/lib/shared/storage')
      expect(defaultBucketName).toBe('b536986d-storage')
    })
  })

  describe('uploadToS3', () => {
    const mockFile = Buffer.from('test file content')
    const mockFileName = 'test.jpg'
    const mockContentType = 'image/jpeg'

    beforeEach(() => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
    })

    it('выбрасывает ошибку если credentials не установлены', async () => {
      const originalAccessKey = process.env.S3_ACCESS_KEY_ID
      const originalSecretKey = process.env.S3_SECRET_ACCESS_KEY
      delete process.env.S3_ACCESS_KEY_ID
      delete process.env.S3_SECRET_ACCESS_KEY
      jest.resetModules()
      const { uploadToS3 } = require('@/lib/shared/storage')

      await expect(
        uploadToS3(mockFile, mockFileName, mockContentType)
      ).rejects.toThrow('S3 credentials are not configured')

      // Восстанавливаем для других тестов
      process.env.S3_ACCESS_KEY_ID = originalAccessKey
      process.env.S3_SECRET_ACCESS_KEY = originalSecretKey
      jest.resetModules()
    })

    it('загружает файл в S3 и возвращает URL', async () => {
      process.env.S3_ENDPOINT = 'https://s3.example.com'
      process.env.S3_BUCKET_NAME = 'test-bucket'
      const { uploadToS3 } = require('@/lib/shared/storage')
      mockSend.mockResolvedValue({})

      const result = await uploadToS3(mockFile, mockFileName, mockContentType)

      expect(mockSend).toHaveBeenCalled()
      expect(result).toContain('photos/')
      expect(result).toContain('test.jpg')
      expect(result).toMatch(/^https:\/\/s3\.example\.com\/test-bucket\/photos\/.+/)
    })

    it('формирует URL для обычного S3', async () => {
      process.env.S3_ENDPOINT = 'https://s3.example.com'
      process.env.S3_BUCKET_NAME = 'test-bucket'
      const { uploadToS3 } = require('@/lib/shared/storage')
      mockSend.mockResolvedValue({})

      const result = await uploadToS3(mockFile, mockFileName, mockContentType)

      expect(result).toMatch(/^https:\/\/s3\.example\.com\/test-bucket\/photos\/.+/)
    })

    it('формирует URL для Supabase Storage с NEXT_PUBLIC_SUPABASE_URL', async () => {
      process.env.S3_ENDPOINT = 'https://storage.supabase.co'
      process.env.S3_BUCKET_NAME = 'test-bucket'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
      jest.resetModules()
      const { uploadToS3 } = require('@/lib/shared/storage')
      mockSend.mockResolvedValue({})

      const result = await uploadToS3(mockFile, mockFileName, mockContentType)

      expect(result).toMatch(/^https:\/\/project\.supabase\.co\/storage\/v1\/object\/public\/test-bucket\/photos\/.+/)
    })

    it('формирует URL для Supabase Storage из endpoint', async () => {
      process.env.S3_ENDPOINT = 'https://project.storage.supabase.co'
      process.env.S3_BUCKET_NAME = 'test-bucket'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      jest.resetModules()
      const { uploadToS3 } = require('@/lib/shared/storage')
      mockSend.mockResolvedValue({})

      const result = await uploadToS3(mockFile, mockFileName, mockContentType)

      expect(result).toMatch(/^https:\/\/project\.supabase\.co\/storage\/v1\/object\/public\/test-bucket\/photos\/.+/)
    })

    it('обрабатывает ошибки загрузки', async () => {
      process.env.S3_BUCKET_NAME = 'test-bucket'
      const { uploadToS3 } = require('@/lib/shared/storage')
      const error = new Error('S3 upload failed')
      mockSend.mockRejectedValue(error)

      await expect(
        uploadToS3(mockFile, mockFileName, mockContentType)
      ).rejects.toThrow('Ошибка загрузки в S3: S3 upload failed')
    })

    it('обрабатывает неизвестные ошибки', async () => {
      process.env.S3_BUCKET_NAME = 'test-bucket'
      const { uploadToS3 } = require('@/lib/shared/storage')
      mockSend.mockRejectedValue('Unknown error')

      await expect(
        uploadToS3(mockFile, mockFileName, mockContentType)
      ).rejects.toThrow('Ошибка загрузки в S3')
    })
  })
})
