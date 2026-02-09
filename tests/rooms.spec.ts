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
    await expect(page.getByRole('columnheader', { name: 'Название' })).toBeVisible();

    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Дублировать')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens room page from name and edit button', async ({ page }) => {
    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();

    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/rooms\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/rooms\/\d+$/);
    await expect(page.getByText('Редактирование помещения')).toBeVisible();
    await expect(page.getByLabel('Название помещения')).toBeVisible();
    await expect(page.getByText('Содержимое помещения')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/rooms$/);
    const rowAfterBack = getFirstActiveRoomRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/rooms\/\d+$/);
    await expect(page.getByText('Редактирование помещения')).toBeVisible();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveRoomRow(page);
    await expect(row).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await row.getByTitle('Печать этикетки').click();
    const popup = await popupPromise;
    expect(popup).toBeTruthy();
  });
});
