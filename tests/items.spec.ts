import { test, expect, type Page } from '@playwright/test';

const ROW_VISIBILITY_TIMEOUT = 10000;
/** Таймаут навигации на страницу сущности (Next.js может компилировать маршрут при первом заходе). */
const NAVIGATION_TIMEOUT = 15000;

const getFirstActiveItemRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

/** Дождаться окончания загрузки списка: либо таблица с данными, либо пустое состояние. */
async function waitForItemsListReady(page: Page) {
  await expect(
    page.getByRole('columnheader', { name: 'Название' }).or(
      page.getByRole('heading', { name: /вещи не найдены|ничего не найдено/i })
    )
  ).toBeVisible({ timeout: 15000 });
}

test.describe('items list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/items');
    await waitForItemsListReady(page);
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить вещь/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Название' })).toBeVisible();

    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Переместить' })).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Дублировать')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens item page from name and edit button', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/items\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/items\/\d+$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByText('Редактирование вещи')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByLabel('Название вещи')).toBeVisible();
    await expect(page.getByText('История перемещений', { exact: true })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/items$/);
    const rowAfterBack = getFirstActiveItemRow(page);
    await expect(rowAfterBack).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/items\/\d+$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByText('Редактирование вещи')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    const dialog = page.getByRole('dialog', { name: 'Переместить вещь' });

    await row.getByRole('button', { name: 'Переместить' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });

    const popupPromise = page.waitForEvent('popup');
    await row.getByTitle('Печать этикетки').click();
    const popup = await popupPromise;
    expect(popup).toBeTruthy();
  });
});
