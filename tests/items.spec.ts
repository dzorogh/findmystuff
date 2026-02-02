import { test, expect, type Page } from '@playwright/test';

const getFirstActiveItemRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

test.describe('items list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/items');
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить вещь/i })).toBeVisible();

    await expect(page.getByRole('columnheader')).toHaveText([
      'ID',
      'Название',
      'Помещение',
      'Дата перемещения',
      'Действия',
    ]);

    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible();
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(5);

    await expect(cells.nth(0)).toHaveText(/#\d+/);
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByRole('link')).toHaveText(/\S/);
    await expect(cells.nth(2)).toHaveText(/\S/);
    await expect(cells.nth(3)).toHaveText(/\S/);

    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByTitle('Переместить')).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens item page from name and edit button', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible();
    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/items\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/items\/\d+$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/items$/);
    const rowAfterBack = getFirstActiveItemRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/items\/\d+$/);
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    const dialog = page.getByRole('dialog', { name: 'Переместить вещь' });

    await row.getByTitle('Переместить').click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible();

    await row.getByTitle('Печать этикетки').click();
    const printFrame = page.locator('iframe[title="Печать этикетки"]');
    await expect(printFrame).toBeAttached();
  });
});
