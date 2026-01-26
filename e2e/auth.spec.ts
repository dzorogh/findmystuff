import { test, expect } from '@playwright/test'

test.describe('Аутентификация', () => {
  test('отображает форму входа для неавторизованных пользователей', async ({
    page,
  }) => {
    await page.goto('/')

    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Проверяем наличие формы входа (текст "Войдите" или кнопка Google)
    const loginText = page.locator('text=/войдите/i')
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Войти"), a:has-text("Google")')
    const loginDescription = page.locator('text=/войдите, чтобы начать/i')
    
    // Один из элементов должен быть виден
    const hasLoginForm = await loginText.or(googleButton).or(loginDescription).first().isVisible({ timeout: 10000 }).catch(() => false)
    expect(hasLoginForm).toBe(true)
  })

  test('перенаправляет на главную после авторизации', async ({ page }) => {
    // Этот тест требует реальной авторизации через Google
    // В реальном сценарии можно использовать моки или тестовые учетные данные
    test.skip('Требует реальной авторизации через Google OAuth')
  })

  test('защищает приватные страницы', async ({ page }) => {
    // Попытка доступа к приватной странице без авторизации
    await page.goto('/items')

    // Ждем загрузки
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Должно перенаправить на главную или показать форму входа
    // Проверяем, что мы либо на главной, либо видна форма входа
    const currentUrl = page.url()
    const isHomePage = currentUrl.endsWith('/') || currentUrl.endsWith('/?') || currentUrl.includes('/?')
    const hasLoginForm = await page.locator('text=/войдите/i').or(page.locator('text=/войдите, чтобы начать/i')).isVisible({ timeout: 5000 }).catch(() => false)
    
    expect(isHomePage || hasLoginForm).toBe(true)
  })
})
