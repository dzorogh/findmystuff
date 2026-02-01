import '@testing-library/jest-dom'

// Подавляем console.error в тестах, чтобы не засорять вывод ожидаемыми ошибками
console.error = jest.fn()
console.warn = jest.fn()
console.log = jest.fn()

// Полифиллы для fetch API в Node.js окружении (для MSW и тестов)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn()
}

// MSW server настраивается в отдельных тестах при необходимости
// Для использования в тестах импортируйте: import { server } from '@/mocks/server'

// Моки для Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useParams() {
    return {}
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Моки для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Моки для ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Моки для scrollIntoView (используется в cmdk)
Element.prototype.scrollIntoView = jest.fn()
