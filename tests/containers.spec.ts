import { test, expect, type Page } from '@playwright/test';

const getFirstActiveContainerRow = (page: Page) =>
  page.getByRole('row').filter({ has: page.getByTitle('Редактировать') }).first();

test.describe('containers list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/containers');
  });

  test('shows list, headers, filters and action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Фильтры/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Добавить контейнер/i })).toBeVisible();

    await expect(page.getByRole('columnheader')).toHaveText([
      'ID',
      'Маркировка / Название',
      'Местоположение',
      'Содержимое',
      'Действия',
    ]);

    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(6);

    await expect(cells.nth(0)).toHaveText(/#\d+/);
    await expect(row.getByRole('link')).toBeVisible();
    await expect(row.getByRole('link')).toHaveText(/\S/);
    await expect(cells.nth(2)).toHaveText(/\S/);
    await expect(cells.nth(3)).toHaveText(/\S/);
    await expect(cells.nth(4)).toHaveText(/\S/);

    await expect(row.getByTitle('Редактировать')).toBeVisible();
    await expect(row.getByTitle('Переместить')).toBeVisible();
    await expect(row.getByTitle('Печать этикетки')).toBeVisible();
    await expect(row.getByTitle('Удалить')).toBeVisible();
  });

  test('opens container page from name and edit button', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();

    const link = row.getByRole('link').first();
    await expect(link).toHaveAttribute('href', /\/containers\/\d+$/);

    await link.click();
    await expect(page).toHaveURL(/\/containers\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование контейнера' })).toBeVisible();
    await expect(page.getByLabel('Название контейнера')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'История перемещений' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Содержимое контейнера' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/containers$/);
    const rowAfterBack = getFirstActiveContainerRow(page);
    await expect(rowAfterBack).toBeVisible();
    await rowAfterBack.getByTitle('Редактировать').click();
    await expect(page).toHaveURL(/\/containers\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Редактирование контейнера' })).toBeVisible();
  });

  test('opens move sheet and cancels', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    const dialog = page.getByRole('dialog', { name: 'Переместить контейнер' });

    await row.getByTitle('Переместить').click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  test('triggers print from list', async ({ page }) => {
    const row = getFirstActiveContainerRow(page);
    await expect(row).toBeVisible();

    await row.getByTitle('Печать этикетки').click();
    const printFrame = page.locator('iframe[title="Печать этикетки"]');
    await expect(printFrame).toBeAttached();
  });
});
