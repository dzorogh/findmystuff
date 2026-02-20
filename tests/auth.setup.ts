import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByRole('textbox', { name: 'Пароль' }).fill(process.env.USER_PASSWORD!);

  // Ловим ответ /api/tenants до перехода, чтобы tenant_id cookie успел установиться в TenantProvider.
  const tenantsResponse = page.waitForResponse(
    (r) => r.url().includes('/api/tenants') && r.status() === 200,
    { timeout: 8000 }
  );
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL('http://localhost:3000/');
  await tenantsResponse;
  await expect(page.getByRole('link', { name: 'Помещения', exact: true })).toBeVisible();

  // TenantProvider ставит tenant_id только при 1 тенанте; при 0 или 2+ cookie может не появиться — не ждём, проверка ниже.
  await page.goto('http://localhost:3000/containers');
  await expect(
    page.getByRole('columnheader', { name: 'Название' }).or(
      page.getByText(/по вашему запросу ничего не найдено|контейнеров не найдены/i)
    )
  ).toBeVisible({ timeout: 5000 });

  // Если видим ошибку про тенант — cookie не установился, setup должен падать с понятной причиной.
  await expect(page.getByText(/выберите тенант|создайте склад/i)).not.toBeVisible();

  await page.context().storageState({ path: authFile });
});