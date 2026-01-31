import { createIconResponse, createIconErrorResponse, IconSize } from '@/lib/shared/og/icon-image'
import { ImageResponse } from 'next/og'

jest.mock('next/og', () => ({
  ImageResponse: jest.fn((element, options) => ({
    element,
    options,
    type: 'ImageResponse',
  })),
}))

// Полифилл для Response в Node.js окружении
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(public body: any, public init?: any) {}
    get status() {
      return this.init?.status || 200
    }
    get statusText() {
      return this.init?.statusText || 'OK'
    }
    get headers() {
      return new Headers(this.init?.headers)
    }
  } as any
}

describe('icon-image', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createIconResponse', () => {
    it('создает ImageResponse с правильным размером', () => {
      const size: IconSize = { width: 100, height: 100 }
      const result = createIconResponse(size)
      
      expect(ImageResponse).toHaveBeenCalledWith(
        expect.anything(),
        size
      )
      expect(result.type).toBe('ImageResponse')
    })

    it('создает ImageResponse с темой light по умолчанию', () => {
      const size: IconSize = { width: 100, height: 100 }
      createIconResponse(size)
      
      expect(ImageResponse).toHaveBeenCalled()
    })

    it('создает ImageResponse с темой dark', () => {
      const size: IconSize = { width: 100, height: 100 }
      createIconResponse(size, 'dark')
      
      expect(ImageResponse).toHaveBeenCalled()
    })

    it('создает ImageResponse с темой light', () => {
      const size: IconSize = { width: 100, height: 100 }
      createIconResponse(size, 'light')
      
      expect(ImageResponse).toHaveBeenCalled()
    })
  })

  describe('createIconErrorResponse', () => {
    const originalConsoleLog = console.log

    beforeEach(() => {
      console.log = jest.fn()
    })

    afterEach(() => {
      console.log = originalConsoleLog
    })

    it('создает Response с ошибкой 500', () => {
      const error = new Error('Test error')
      const result = createIconErrorResponse(error)
      
      expect(result).toBeInstanceOf(Response)
      expect(result.status).toBe(500)
      expect(console.log).toHaveBeenCalledWith('Test error')
    })

    it('обрабатывает неизвестные ошибки', () => {
      const result = createIconErrorResponse('Unknown error')
      
      expect(result).toBeInstanceOf(Response)
      expect(result.status).toBe(500)
      expect(console.log).toHaveBeenCalledWith('Unknown error')
    })

    it('обрабатывает null ошибки', () => {
      const result = createIconErrorResponse(null)
      
      expect(result).toBeInstanceOf(Response)
      expect(result.status).toBe(500)
      expect(console.log).toHaveBeenCalledWith('Unknown error')
    })
  })
})
