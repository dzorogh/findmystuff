import { test, expect } from '@playwright/test';

test('has menu', async ({ page }) => {
  // page is authenticated
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Помещения', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Места', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Контейнеры', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Вещи', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Пользователи', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Настройки', exact: true })).toBeVisible();
});