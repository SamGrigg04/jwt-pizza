import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login } from './mockService';

async function openAdminDashboard(page: Page) {
  await basicInit(page);
  await login(page, 'a@jwt.com', 'admin');
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
}

test('admin dashboard lists franchises with paging', async ({ page }) => {
  await openAdminDashboard(page);

  await expect(page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' })).toHaveCount(0);
  await expect(page.getByRole('row', { name: 'LotaPizza' })).toContainText('Fran Chise');
  await expect(page.getByRole('row', { name: 'Spanish Fork' })).toContainText('3 ₿');
  await expect(page.getByRole('row', { name: 'topSpot' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'SliceCity' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '«' })).toBeDisabled();

  await page.getByRole('button', { name: '»' }).click();
  await expect(page.getByRole('row', { name: 'SliceCity' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'LotaPizza' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '»' })).toBeDisabled();

  await page.getByRole('button', { name: '«' }).click();
  await expect(page.getByRole('row', { name: 'LotaPizza' })).toBeVisible();
});

test('admin creates and filters for a franchise', async ({ page }) => {
  await openAdminDashboard(page);

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
  await page.getByPlaceholder('franchise name').fill('Pizza Palace');
  await page.getByPlaceholder('franchisee admin email').fill('f@jwt.com');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await page.getByPlaceholder('Filter franchises').fill('palace');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('row', { name: 'Pizza Palace' })).toContainText('Fran Chise');
  await expect(page.getByRole('row', { name: 'LotaPizza' })).toHaveCount(0);
});

test('admin closes a franchise', async ({ page }) => {
  await openAdminDashboard(page);

  await page.getByRole('row', { name: 'topSpot' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the topSpot franchise?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await expect(page.getByRole('row', { name: 'SliceCity' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'topSpot' })).toHaveCount(0);
});

test('admin closes a store', async ({ page }) => {
  await openAdminDashboard(page);

  await page.getByRole('row', { name: 'Lehi' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the LotaPizza store Lehi ?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await expect(page.getByRole('row', { name: 'Springville' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lehi' })).toHaveCount(0);
});

test('diners cannot see the admin dashboard', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);

  await page.goto('/admin-dashboard');
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});
