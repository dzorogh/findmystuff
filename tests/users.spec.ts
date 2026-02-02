import { test, expect, type Page } from '@playwright/test';

const getFirstUserRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: /Редактировать пользователя/i }) }).first();

test.describe('users list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('shows list, headers and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Добавить пользователя/i })).toBeVisible();

    await expect(page.getByRole('columnheader')).toHaveText([
      'Email',
      'Создан',
      'Последний вход',
      'Действия',
    ]);

    const row = getFirstUserRow(page);
    await expect(row).toBeVisible();
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(4);

    await expect(cells.nth(0)).toHaveText(/\S/);
    await expect(cells.nth(1)).toHaveText(/\S/);
    await expect(cells.nth(2)).toHaveText(/\S/);

    await expect(row.getByRole('button', { name: /Редактировать пользователя/i })).toBeVisible();
    await expect(row.getByRole('button', { name: /Удалить пользователя/i })).toBeVisible();
  });

  test('opens edit sheet and cancels', async ({ page }) => {
    const row = getFirstUserRow(page);
    const dialog = page.getByRole('dialog', { name: 'Редактировать пользователя' });

    await row.getByRole('button', { name: /Редактировать пользователя/i }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });
});
