import { test, expect, type Page } from '@playwright/test';

const ROW_VISIBILITY_TIMEOUT = 10000;

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

    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });

    await expect(page.getByRole('columnheader')).toHaveText([
      'ID',
      'Название',
      'Помещение',
      'Дата перемещения',
      'Действия',
    ]);
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
    await expect(row.getByTitle('Дублировать')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens item page from name and edit button', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/items\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/items\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование вещи' })).toBeVisible();
    await expect(page.getByLabel('Название вещи')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'История перемещений' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/items$/);
    const rowAfterBack = getFirstActiveItemRow(page);
    await expect(rowAfterBack).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/items\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование вещи' })).toBeVisible();
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActiveItemRow(page);
    await expect(row).toBeVisible({ timeout: ROW_VISIBILITY_TIMEOUT });
    const dialog = page.getByRole('dialog', { name: 'Переместить вещь' });

    await row.getByTitle('Переместить').click();
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
