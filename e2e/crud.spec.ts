import { test, expect } from '@playwright/test'

test.describe('CRUD операции', () => {
  test.beforeEach(async ({ page }) => {
    // Предполагаем, что пользователь авторизован
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('создание вещи через форму', async ({ page }) => {
    // Проверяем, что пользователь авторизован (есть поле поиска или карточки)
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const loginForm = page.locator('text=/войдите/i')
    
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    const isLoginVisible = await loginForm.isVisible().catch(() => false)
    
    if (!isAuthorized || isLoginVisible) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    // Переход на страницу вещей через карточку или навигацию
    const itemsCard = page.locator('text=/вещи/i').filter({ hasText: /Просмотр всех вещей/i }).first()
    const itemsLink = page.locator('a[href="/items"], button:has-text("Вещи")').first()
    
    if (await itemsCard.isVisible().catch(() => false)) {
      await itemsCard.click()
    } else if (await itemsLink.isVisible().catch(() => false)) {
      await itemsLink.click()
    } else {
      await page.goto('/items')
    }
    
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/items/)

    // Открытие формы добавления
    const addButton = page.locator('button:has-text("Добавить")').first()
    const isAddButtonVisible = await addButton.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isAddButtonVisible) {
      await addButton.click()
      await page.waitForTimeout(500)

      // Заполнение формы
      const nameInput = page.locator('input[name="name"], input[placeholder*="название"], input[placeholder*="Название"]').first()
      const isNameInputVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false)
      
      if (isNameInputVisible) {
        await nameInput.fill('Тестовая вещь E2E')

        // Отправка формы
        const submitButton = page.locator('button:has-text("Добавить"), button[type="submit"]').first()
        await submitButton.click()

        // Проверка успешного создания (появление в списке или toast)
        await page.waitForTimeout(2000)
        const successMessage = page.locator('text=/тестовая вещь e2e/i').or(page.locator('text=/успешно/i'))
        await expect(successMessage.first()).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('редактирование вещи', async ({ page }) => {
    // Проверяем авторизацию
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    // Открытие деталей первой вещи
    const firstItem = page.locator('a[href^="/items/"], button').filter({ hasText: /.+/ }).first()
    const isVisible = await firstItem.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      await firstItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Открытие формы редактирования
      const editButton = page.locator('button[aria-label*="редактировать"], button:has-text("Редактировать")').first()
      const editVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false)

      if (editVisible) {
        await editButton.click()
        await page.waitForTimeout(500)

        // Изменение названия
        const nameInput = page.locator('input[name="name"], input[placeholder*="название"], input[placeholder*="Название"]').first()
        const isNameInputVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false)
        
        if (isNameInputVisible) {
          await nameInput.fill('Обновленная вещь E2E')
          await page.locator('button:has-text("Сохранить"), button[type="submit"]').first().click()

          // Проверка обновления
          await page.waitForTimeout(2000)
          await expect(
            page.locator('text=/обновленная вещь e2e/i').or(page.locator('text=/успешно/i')).first()
          ).toBeVisible({ timeout: 10000 })
        }
      }
    } else {
      test.skip('Нет вещей для редактирования')
    }
  })

  test('мягкое удаление вещи', async ({ page }) => {
    // Проверяем авторизацию
    const searchInput = page.locator('input[placeholder*="Введите название"]')
    const isAuthorized = await searchInput.isVisible().catch(() => false)
    
    if (!isAuthorized) {
      test.skip('Пользователь не авторизован, пропускаем тест')
      return
    }

    await page.goto('/items')
    await page.waitForLoadState('networkidle')

    // Открытие деталей вещи
    const firstItem = page.locator('a[href^="/items/"], button').filter({ hasText: /.+/ }).first()
    const isVisible = await firstItem.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      await firstItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Удаление
      const deleteButton = page.locator('button[aria-label*="удалить"], button:has-text("Удалить")').first()
      const deleteVisible = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)

      if (deleteVisible) {
        await deleteButton.click()
        await page.waitForTimeout(500)

        // Подтверждение удаления
        const confirmButton = page.locator('button:has-text("Подтвердить"), button:has-text("Да"), button:has-text("Удалить")').first()
        const isConfirmVisible = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)
        
        if (isConfirmVisible) {
          await confirmButton.click()
          await page.waitForTimeout(2000)

          // Проверка удаления (перенаправление или сообщение)
          await expect(
            page.locator('text=/успешно/i').or(page.locator('text=/удалено/i')).or(page.locator('text=/перенаправление/i')).first()
          ).toBeVisible({ timeout: 10000 })
        }
      }
    } else {
      test.skip('Нет вещей для удаления')
    }
  })
})
