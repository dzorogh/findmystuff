import { test, expect } from '@playwright/test';

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('shows sections and add buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Контейнеры' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Места' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Помещения' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Вещи' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Типы контейнеров' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Типы мест' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Типы помещений' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Типы вещей' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Добавить тип' })).toHaveCount(4);
  });

  test('opens add type dialog and cancels', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить тип' }).first();
    const dialog = page.getByRole('dialog', { name: 'Добавить тип' });

    await addButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });
});
