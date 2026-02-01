import { test, expect } from '@playwright/test';

test('has menu', async ({ page }) => {
  // page is authenticated
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Помещения' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Места' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Контейнеры' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Вещи' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Пользователи' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Настройки' })).toBeVisible();
});