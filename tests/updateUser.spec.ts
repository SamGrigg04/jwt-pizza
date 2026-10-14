import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login, register } from './mockService';

// Opens the edit dialog on the diner dashboard, fills in whichever fields are given, and submits
async function editUser(page: Page, changes: { name?: string; email?: string; password?: string }) {
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  if (changes.name) {
    await page.getByRole('textbox').first().fill(changes.name);
  }
  if (changes.email) {
    await page.locator('input[type="email"]').fill(changes.email);
  }
  if (changes.password) {
    await page.locator('#password').fill(changes.password);
  }
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
}

test('updateUser', async ({ page }) => {
  await basicInit(page);
  await register(page, 'pizza diner', 'pd@jwt.com', 'diner');
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza diner');

  await editUser(page, { name: 'pizza dinerx' });
  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, 'pd@jwt.com', 'diner');
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updateUser email and password', async ({ page }) => {
  await basicInit(page);
  await register(page, 'pizza diner', 'old@jwt.com', 'diner');
  await page.getByRole('link', { name: 'pd' }).click();

  await editUser(page, { email: 'new@jwt.com', password: 'newpassword' });

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, 'new@jwt.com', 'newpassword');
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('new@jwt.com');
});

test('updateUser franchisee keeps roles', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await page.getByRole('link', { name: 'FC' }).click();

  await editUser(page, { name: 'Fran Chiser' });

  await expect(page.getByRole('main')).toContainText('Fran Chiser');
  await expect(page.getByRole('main')).toContainText('Franchisee on 2');
});

test('updateUser admin keeps roles', async ({ page }) => {
  await basicInit(page);
  await login(page, 'a@jwt.com', 'admin');
  await page.getByRole('link', { name: 'MR' }).click();

  await editUser(page, { name: 'Mama Rucci' });

  await expect(page.getByRole('main')).toContainText('Mama Rucci');
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();
});
