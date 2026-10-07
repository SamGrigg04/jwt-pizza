import { Page } from '@playwright/test';
import { test, expect } from './testSetup';
import { basicInit, login } from './mockService';

async function openFranchiseDashboard(page: Page) {
  await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
}

test('franchise pitch for visitors, then franchisee login', async ({ page }) => {
  await basicInit(page);
  await openFranchiseDashboard(page);

  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
  await expect(page.getByRole('row', { name: '2020' })).toContainText('50 ₿');
  await expect(page.getByRole('heading', { name: 'Unleash Your Potential' })).toBeVisible();

  await page.getByRole('main').getByRole('link', { name: 'login' }).click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Password').fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lehi' })).toContainText('0.05 ₿');
  await expect(page.getByRole('row', { name: 'American Fork' })).toContainText('1.5 ₿');
});

test('franchisee roles on diner dashboard', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await page.getByRole('link', { name: 'FC' }).click();

  await expect(page.getByRole('main')).toContainText('diner, Franchisee on 2');
});

test('franchisee creates a store', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await openFranchiseDashboard(page);

  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await page.getByPlaceholder('store name').fill('Provo');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  await expect(page.getByRole('row', { name: 'Provo' })).toContainText('0 ₿');
});

test('franchisee closes a store', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'franchisee');
  await openFranchiseDashboard(page);

  await page.getByRole('row', { name: 'Springville' }).getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the LotaPizza store Springville ?');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  await expect(page.getByRole('row', { name: 'Lehi' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Springville' })).toHaveCount(0);
});
