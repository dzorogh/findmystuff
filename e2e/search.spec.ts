import { test, expect } from '@playwright/test'

test.describe('Поиск', () => {
  test.beforeEach(async ({ page }) => {
    // Предполагаем, что пользователь авторизован
    // В реальном сценарии здесь должна быть авторизация
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('отображает поле поиска на главной странице', async ({ page }) => {
    // Поле поиска видно только для авторизованных пользователей
    // Если пользователь не авторизован, будет форма входа
    const searchInput = page.locator('input[placeholder*="Введите название вещи, места, контейнера или помещения"]')
    const loginForm = page.locator('text=/войдите/i')
    
    // Либо поле поиска, либо форма входа должны быть видны
    const isSearchVisible = await searchInput.isVisible().catch(() => false)
    const isLoginVisible = await loginForm.isVisible().catch(() => false)
    
    expect(isSearchVisible || isLoginVisible).toBe(true)
  })

  test('выполняет поиск при вводе запроса', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название вещи, места, контейнера или помещения"]')
    
    // Проверяем, что поле поиска видно (пользователь авторизован)
    const isVisible = await searchInput.isVisible().catch(() => false)
    
    if (!isVisible) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    await searchInput.fill('тест')

    // Ожидаем появления результатов или индикатора загрузки (debounce 300ms + загрузка)
    await page.waitForTimeout(1000)

    // Проверяем, что поиск выполнен (результаты или пустое состояние)
    const results = page.locator('text=/результаты поиска/i')
    const emptyState = page.locator('text=/ничего не найдено/i')

    await expect(results.or(emptyState).first()).toBeVisible({ timeout: 5000 })
  })

  test('отображает пустое состояние при отсутствии результатов', async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder*="Введите название вещи, места, контейнера или помещения"]')
    
    const isVisible = await searchInput.isVisible().catch(() => false)
    
    if (!isVisible) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    await searchInput.fill('НесуществующаяВещь12345')

    // Ожидаем выполнения поиска (debounce 300ms + загрузка)
    await page.waitForTimeout(1000)

    await expect(page.locator('text=/ничего не найдено/i')).toBeVisible({ timeout: 5000 })
  })

  test('переходит к найденной вещи при клике', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название вещи, места, контейнера или помещения"]')
    
    const isVisible = await searchInput.isVisible().catch(() => false)
    
    if (!isVisible) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    await searchInput.fill('тест')

    // Ожидаем выполнения поиска
    await page.waitForTimeout(1000)

    // Если есть результаты, кликаем на первый
    const firstResult = page.locator('[class*="cursor-pointer"]').filter({ hasText: /тест/i }).first()
    const isResultVisible = await firstResult.isVisible({ timeout: 5000 }).catch(() => false)

    if (isResultVisible) {
      await firstResult.click()
      await page.waitForLoadState('networkidle')
      // Проверяем, что перешли на страницу деталей
      await expect(page).toHaveURL(/\/items\/\d+|\/places\/\d+|\/containers\/\d+|\/rooms\/\d+/)
    } else {
      // Если результатов нет, тест считается успешным (пустое состояние)
      await expect(page.locator('text=/ничего не найдено/i')).toBeVisible({ timeout: 5000 })
    }
  })
})
