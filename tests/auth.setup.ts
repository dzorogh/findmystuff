import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  await page.getByLabel('Email').fill(process.env.USER_EMAIL!);
  await page.getByRole('textbox', { name: 'Пароль' }).fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('http://localhost:3000/');
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByRole('link', { name: 'Помещения', exact: true })).toBeVisible();

  await page.context().storageState({ path: authFile });
});