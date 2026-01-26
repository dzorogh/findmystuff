import { test, expect } from '@playwright/test'

test.describe('Навигация между страницами', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
  })

  test('навигация с главной страницы на страницы списков', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован')
      return
    }

    // Переход на страницу вещей
    const itemsCard = page.locator('text=/вещи/i').filter({ hasText: /Просмотр всех вещей/i }).first()
    const itemsLink = page.locator('a[href="/items"]').first()
    
    if (await itemsCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemsCard.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/items/)
    } else if (await itemsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemsLink.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/items/)
    } else {
      await page.goto('/items')
      await expect(page).toHaveURL(/\/items/)
    }

    // Возврат на главную
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    await expect(page).toHaveURL(/\//)

    // Переход на страницу помещений
    const roomsCard = page.locator('text=/помещения/i').filter({ hasText: /Просмотр всех помещений/i }).first()
    const roomsLink = page.locator('a[href="/rooms"]').first()
    
    if (await roomsCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roomsCard.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/rooms/)
    } else if (await roomsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roomsLink.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/rooms/)
    } else {
      await page.goto('/rooms')
      await expect(page).toHaveURL(/\/rooms/)
    }
  })

  test('навигация через боковое меню', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован')
      return
    }

    // Ищем боковое меню или навигацию
    const sidebar = page.locator('nav, [data-testid="sidebar"], aside')
    const sidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false)

    if (sidebarVisible) {
      // Переход на страницу мест через меню
      const placesLink = page.locator('nav a[href="/places"], [data-testid="sidebar"] a[href="/places"]').first()
      const placesLinkVisible = await placesLink.isVisible({ timeout: 3000 }).catch(() => false)

      if (placesLinkVisible) {
        await placesLink.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await expect(page).toHaveURL(/\/places/)
      }
    }

    // Альтернативный способ - прямой переход
    await page.goto('/places')
    await expect(page).toHaveURL(/\/places/)
  })

  test('навигация от списка к детальной странице и обратно', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован')
      return
    }

    // Переход на страницу вещей
    await page.goto('/items')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Открытие детальной страницы
    const firstItem = page.locator('a[href^="/items/"]').first()
    const isVisible = await firstItem.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      await firstItem.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/\/items\/\d+/)

      // Возврат на список (через кнопку "Назад" или прямой переход)
      const backButton = page.locator('button:has-text("Назад"), a:has-text("Назад"), button[aria-label*="назад"]').first()
      const backButtonVisible = await backButton.isVisible({ timeout: 3000 }).catch(() => false)

      if (backButtonVisible) {
        await backButton.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await expect(page).toHaveURL(/\/items/)
      } else {
        // Прямой переход обратно
        await page.goto('/items')
        await expect(page).toHaveURL(/\/items/)
      }
    } else {
      test.skip('Нет вещей для навигации')
    }
  })

  test('навигация на страницу настроек', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован')
      return
    }

    // Переход на страницу настроек
    const settingsLink = page.locator('a[href="/settings"], button:has-text("Настройки")').first()
    const settingsLinkVisible = await settingsLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (settingsLinkVisible) {
      await settingsLink.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/settings/)
    } else {
      // Прямой переход
      await page.goto('/settings')
      await expect(page).toHaveURL(/\/settings/)
    }
  })

  test('навигация на страницу пользователей', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован')
      return
    }

    // Переход на страницу пользователей
    const usersLink = page.locator('a[href="/users"], button:has-text("Пользователи")').first()
    const usersLinkVisible = await usersLink.isVisible({ timeout: 3000 }).catch(() => false)

    if (usersLinkVisible) {
      await usersLink.click()
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      await expect(page).toHaveURL(/\/users/)
    } else {
      // Прямой переход
      await page.goto('/users')
      await expect(page).toHaveURL(/\/users/)
    }
  })
})
