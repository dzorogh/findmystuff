# Тесты проекта FindMyStuff

## Быстрый старт

### Установка зависимостей

```bash
npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  msw \
  @types/jest
```

### Запуск тестов

```bash
# Unit и Component тесты
npm run test

# Тесты в watch режиме
npm run test:watch

# С покрытием кода
npm run test:coverage

# E2E тесты
npm run test:e2e

# E2E тесты с UI
npm run test:e2e:ui

# Все тесты
npm run test:all
```

## Структура

- `__tests__/lib/` - Unit тесты для утилит
- `__tests__/hooks/` - Тесты для React хуков
- `__tests__/components/` - Тесты для React компонентов
- `e2e/` - End-to-end тесты
- `mocks/` - MSW моки для API

## Написание тестов

### Unit тест

```typescript
import { generateContainerMarking } from '@/lib/utils'

describe('generateContainerMarking', () => {
  it('генерирует маркировку', () => {
    const result = generateContainerMarking('КОР', 5)
    expect(result).toBe('КОР-005')
  })
})
```

### Component тест

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('рендерится с текстом', () => {
    render(<Button>Нажми</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### E2E тест

```typescript
import { test, expect } from '@playwright/test'

test('создание вещи', async ({ page }) => {
  await page.goto('/items')
  await page.click('button:has-text("Добавить")')
  // ...
})
```

## Дополнительная информация

Подробная документация: [TESTING_METHODOLOGY.md](../TESTING_METHODOLOGY.md)
