import { test, expect } from '@playwright/test'

test.describe('Детальные страницы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
  })

  test.describe('Детальная страница помещения', () => {
    test('открывает детальную страницу помещения', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      // Переходим на страницу помещений
      await page.goto('/rooms')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Ищем ссылку на первое помещение
      const firstRoom = page.locator('a[href^="/rooms/"]').first()
      const isVisible = await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstRoom.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(500)

        // Проверяем что мы на детальной странице
        await expect(page).toHaveURL(/\/rooms\/\d+/)
        
        // Проверяем наличие элементов страницы
        const pageContent = page.locator('main, [data-testid="room-detail"]')
        const hasContent = await pageContent.isVisible({ timeout: 5000 }).catch(() => false)
        expect(hasContent).toBe(true)
      } else {
        test.skip('Нет помещений для просмотра')
      }
    })

    test('отображает информацию о помещении', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/rooms')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const firstRoom = page.locator('a[href^="/rooms/"]').first()
      const isVisible = await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstRoom.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(1000)

        // Проверяем наличие заголовка или информации
        const title = page.locator('h1, h2, [data-testid="room-name"]')
        const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false)
        expect(hasTitle).toBe(true)
      } else {
        test.skip('Нет помещений для просмотра')
      }
    })
  })

  test.describe('Детальная страница места', () => {
    test('открывает детальную страницу места', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/places')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const firstPlace = page.locator('a[href^="/places/"]').first()
      const isVisible = await firstPlace.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstPlace.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/\/places\/\d+/)
      } else {
        test.skip('Нет мест для просмотра')
      }
    })
  })

  test.describe('Детальная страница контейнера', () => {
    test('открывает детальную страницу контейнера', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/containers')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const firstContainer = page.locator('a[href^="/containers/"]').first()
      const isVisible = await firstContainer.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstContainer.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/\/containers\/\d+/)
      } else {
        test.skip('Нет контейнеров для просмотра')
      }
    })
  })

  test.describe('Детальная страница вещи', () => {
    test('открывает детальную страницу вещи', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/items')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const firstItem = page.locator('a[href^="/items/"]').first()
      const isVisible = await firstItem.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstItem.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(500)

        await expect(page).toHaveURL(/\/items\/\d+/)
      } else {
        test.skip('Нет вещей для просмотра')
      }
    })

    test('отображает информацию о вещи', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/items')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const firstItem = page.locator('a[href^="/items/"]').first()
      const isVisible = await firstItem.isVisible({ timeout: 5000 }).catch(() => false)

      if (isVisible) {
        await firstItem.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        await page.waitForTimeout(1000)

        // Проверяем наличие информации о вещи
        const content = page.locator('main, [data-testid="item-detail"]')
        const hasContent = await content.isVisible({ timeout: 5000 }).catch(() => false)
        expect(hasContent).toBe(true)
      } else {
        test.skip('Нет вещей для просмотра')
      }
    })
  })
})
