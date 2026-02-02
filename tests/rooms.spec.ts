import { test, expect, type Page } from '@playwright/test';

const getFirstActiveRoomRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

test.describe('rooms list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rooms');
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить помещение/i })).toBeVisible();

    await expect(page.getByRole('columnheader')).toHaveText([
      'ID',
      'Название',
      'Вещей',
      'Мест',
      'Контейнеров',
      'Создано',
      'Действия',
    ]);

    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(7);

    await expect(cells.nth(0)).toHaveText(/#\d+/);
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByRole('link')).toHaveText(/\S/);
    await expect(cells.nth(2)).toHaveText(/\d+/);
    await expect(cells.nth(3)).toHaveText(/\d+/);
    await expect(cells.nth(4)).toHaveText(/\d+/);
    await expect(cells.nth(5)).toHaveText(/\S/);

    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens room page from name and edit button', async ({ page }) => {
    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();

    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/rooms\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/rooms\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование помещения' })).toBeVisible();
    await expect(page.getByLabel('Название помещения')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Содержимое помещения' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/rooms$/);
    const rowAfterBack = getFirstActiveRoomRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/rooms\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование помещения' })).toBeVisible();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();

    await row.getByTitle('Печать этикетки').click();
    const printFrame = page.locator('iframe[title="Печать этикетки"]');
    await expect(printFrame).toBeAttached();
  });
});
