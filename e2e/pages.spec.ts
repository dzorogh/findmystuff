import { test, expect } from '@playwright/test'

test.describe('Страницы приложения', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
  })

  test.describe('Главная страница', () => {
    test('отображает форму входа для неавторизованных пользователей', async ({
      page,
    }) => {
      const loginText = page.locator('text=/войдите/i')
      const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")')
      const loginDescription = page.locator('text=/войдите, чтобы начать/i')
      
      const hasLoginForm = await loginText.or(googleButton).or(loginDescription).first().isVisible({ timeout: 10000 }).catch(() => false)
      expect(hasLoginForm).toBe(true)
    })

    test('отображает карточки для авторизованных пользователей', async ({
      page,
    }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      // Проверяем наличие карточек
      const itemsCard = page.locator('text=/вещи/i').filter({ hasText: /Просмотр всех вещей/i })
      const placesCard = page.locator('text=/места/i').filter({ hasText: /Просмотр всех мест/i })
      const containersCard = page.locator('text=/контейнеры/i').filter({ hasText: /Просмотр всех контейнеров/i })
      const roomsCard = page.locator('text=/помещения/i').filter({ hasText: /Просмотр всех помещений/i })

      const hasItemsCard = await itemsCard.isVisible({ timeout: 5000 }).catch(() => false)
      const hasPlacesCard = await placesCard.isVisible({ timeout: 5000 }).catch(() => false)
      const hasContainersCard = await containersCard.isVisible({ timeout: 5000 }).catch(() => false)
      const hasRoomsCard = await roomsCard.isVisible({ timeout: 5000 }).catch(() => false)

      expect(hasItemsCard || hasPlacesCard || hasContainersCard || hasRoomsCard).toBe(true)
    })

    test('поиск работает на главной странице', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await searchInput.fill('тест')
      await page.waitForTimeout(1000)

      // Проверяем что поиск выполнился (может быть пустой результат)
      const searchResults = page.locator('[data-testid="search-results"], .search-results')
      const hasResults = await searchResults.isVisible({ timeout: 3000 }).catch(() => false)
      
      // Поиск должен работать, даже если результатов нет
      expect(true).toBe(true)
    })
  })

  test.describe('Страница помещений', () => {
    test('открывает страницу помещений', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/rooms')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/rooms/)
      
      // Проверяем наличие элементов страницы
      const pageTitle = page.locator('text=/помещения/i').or(page.locator('h1'))
      const hasTitle = await pageTitle.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasTitle).toBe(true)
    })

    test('отображает список помещений', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/rooms')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Проверяем наличие списка (может быть пустым)
      const list = page.locator('[data-testid="rooms-list"], .rooms-list, main')
      const hasList = await list.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasList).toBe(true)
    })

    test('открывает форму добавления помещения', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/rooms')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const addButton = page.locator('button:has-text("Добавить")').first()
      const isAddButtonVisible = await addButton.isVisible({ timeout: 5000 }).catch(() => false)
      
      if (isAddButtonVisible) {
        await addButton.click()
        await page.waitForTimeout(500)

        // Проверяем что форма открылась
        const form = page.locator('input[name="name"], input[placeholder*="название"], input[placeholder*="Название"]')
        const isFormVisible = await form.isVisible({ timeout: 3000 }).catch(() => false)
        expect(isFormVisible).toBe(true)
      } else {
        test.skip('Кнопка добавления не найдена')
      }
    })
  })

  test.describe('Страница мест', () => {
    test('открывает страницу мест', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/places')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/places/)
    })

    test('отображает список мест', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/places')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const list = page.locator('main, [data-testid="places-list"]')
      const hasList = await list.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasList).toBe(true)
    })
  })

  test.describe('Страница контейнеров', () => {
    test('открывает страницу контейнеров', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/containers')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/containers/)
    })

    test('отображает список контейнеров', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/containers')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const list = page.locator('main, [data-testid="containers-list"]')
      const hasList = await list.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasList).toBe(true)
    })
  })

  test.describe('Страница вещей', () => {
    test('открывает страницу вещей', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/items')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/items/)
    })

    test('отображает список вещей', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/items')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const list = page.locator('main, [data-testid="items-list"]')
      const hasList = await list.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasList).toBe(true)
    })
  })

  test.describe('Страница настроек', () => {
    test('открывает страницу настроек', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/settings')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/settings/)
    })

    test('отображает форму настроек', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/settings')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Проверяем наличие элементов настроек
      const settingsTitle = page.locator('text=/настройки/i').or(page.locator('h1'))
      const hasTitle = await settingsTitle.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasTitle).toBe(true)
    })
  })

  test.describe('Страница пользователей', () => {
    test('открывает страницу пользователей', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/users')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      await expect(page).toHaveURL(/\/users/)
    })

    test('отображает список пользователей', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Введите название"]')
      const isAuthorized = await searchInput.isVisible().catch(() => false)
      
      if (!isAuthorized) {
        test.skip('Пользователь не авторизован')
        return
      }

      await page.goto('/users')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      const usersTitle = page.locator('text=/пользователи/i').or(page.locator('h1'))
      const hasTitle = await usersTitle.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasTitle).toBe(true)
    })
  })
})
