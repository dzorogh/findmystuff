import { test, expect, type Page } from '@playwright/test';

const getFirstActivePlaceRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

test.describe('places list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/places');
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить место/i })).toBeVisible();

    await expect(page.getByRole('columnheader')).toHaveText([
      'ID',
      'Название',
      'Вещей',
      'Контейнеров',
      'Помещение',
      'Создано',
      'Действия',
    ]);

    const row = getFirstActivePlaceRow(page);
    await expect(row).toBeVisible();
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(7);

    await expect(cells.nth(0)).toHaveText(/#\d+/);
    const placeLink = row.locator('a[href^="/places/"]').first();
    await expect(placeLink).toBeVisible();
    await expect(placeLink).toHaveText(/\S/);
    await expect(cells.nth(2)).toHaveText(/\d+/);
    await expect(cells.nth(3)).toHaveText(/\d+/);
    await expect(cells.nth(4)).toHaveText(/\S/);
    await expect(cells.nth(5)).toHaveText(/\S/);

    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByTitle('Переместить')).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens place page from name and edit button', async ({ page }) => {
    const row = getFirstActivePlaceRow(page);
    await expect(row).toBeVisible();

    const link = row.locator('a[href^="/places/"]').first();
    await expect(link).toHaveAttribute('href', /\/places\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/places\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование места' })).toBeVisible();
    await expect(page.getByLabel('Название места')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Содержимое места' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'История перемещений' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/places$/);
    const rowAfterBack = getFirstActivePlaceRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/places\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование места' })).toBeVisible();
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActivePlaceRow(page);
    const dialog = page.getByRole('dialog', { name: 'Переместить место' });

    await row.getByTitle('Переместить').click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActivePlaceRow(page);
    await expect(row).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await row.getByTitle('Печать этикетки').click();
    const popup = await popupPromise;
    expect(popup).toBeTruthy();
  });
});
