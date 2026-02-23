import { test, expect, type Page } from '@playwright/test';

const getFirstActiveContainerRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

/** Дождаться окончания загрузки списка: либо таблица с заголовками, либо пустое состояние. */
async function waitForContainersListReady(page: Page) {
  const listOrEmpty = page
    .getByRole('columnheader', { name: 'Название' })
    .or(page.getByText(/по вашему запросу ничего не найдено/i));
  try {
    await expect(listOrEmpty).toBeVisible({ timeout: 5000 });
  } catch {
    if (await page.getByRole('heading', { name: 'Поиск' }).isVisible()) {
      await page.locator('a[href="/containers"]').first().click();
    }
    await expect(listOrEmpty).toBeVisible({ timeout: 15000 });
  }
}

test.describe('containers list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/containers');
    await waitForContainersListReady(page);
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить контейнер/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Название' })).toBeVisible();

    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Переместить' })).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Дублировать')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens container page from name and edit button', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();

    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/containers\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/containers\/\d+$/);
    await expect(page.getByText('Редактирование контейнера')).toBeVisible();
    await expect(page.getByLabel('Название контейнера')).toBeVisible();
    await expect(page.getByText('История перемещений')).toBeVisible();
    await expect(page.getByText('Содержимое контейнера')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/containers$/);
    const rowAfterBack = getFirstActiveContainerRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/containers\/\d+$/);
    await expect(page.getByText('Редактирование контейнера')).toBeVisible();
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();
    const dialog = page.getByRole('dialog', { name: 'Переместить контейнер' });

    await row.getByRole('button', { name: 'Переместить' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await row.getByTitle('Печать этикетки').click();
    const popup = await popupPromise;
    expect(popup).toBeTruthy();
  });
});
