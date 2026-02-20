import { test, expect, type Page } from '@playwright/test';

const getFirstActivePlaceRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

/** Дождаться загрузки страницы списка мест. */
async function waitForPlacesListReady(page: Page) {
  await expect(
    page.getByRole('columnheader', { name: 'Название' }).or(
      page.getByText(/по вашему запросу ничего не найдено|мест не найдены/i)
    )
  ).toBeVisible({ timeout: 5000 });
}

test.describe('places list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/places');
    await waitForPlacesListReady(page);
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить место/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Название' })).toBeVisible();

    const row = getFirstActivePlaceRow(page);
    await expect(row).toBeVisible();
    await expect(row.locator('a[href^="/places/"]').first()).toBeVisible();
    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Переместить' })).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Дублировать')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens place page from name and edit button', async ({ page }) => {
    const row = getFirstActivePlaceRow(page);
    await expect(row).toBeVisible();

    const link = row.locator('a[href^="/places/"]').first();
    await expect(link).toHaveAttribute('href', /\/places\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/places\/\d+$/);
    await expect(page.getByText('Редактирование места')).toBeVisible();
    await expect(page.getByLabel('Название места')).toBeVisible();
    await expect(page.getByText('История перемещений')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/places$/);
    const rowAfterBack = getFirstActivePlaceRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/places\/\d+$/);
    await expect(page.getByText('Редактирование места')).toBeVisible();
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActivePlaceRow(page);
    const dialog = page.getByRole('dialog', { name: 'Переместить место' });

    await row.getByRole('button', { name: 'Переместить' }).click();
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
