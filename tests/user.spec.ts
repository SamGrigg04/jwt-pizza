import { test, expect } from './testSetup';
import { basicInit, login } from './mockService';

test('register a new diner, view dashboard, and logout', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to the party' })).toBeVisible();

  await page.getByPlaceholder('Full name').fill('Pizza Diner');
  await page.getByPlaceholder('Email address').fill('new@jwt.com');
  await page.getByPlaceholder('Password').fill('secret');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'PD' }).click();
  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Pizza Diner');
  await expect(page.getByRole('main')).toContainText('new@jwt.com');
  await expect(page.getByText('How have you lived this long without having a pizza?')).toBeVisible();

  await page.getByRole('link', { name: 'Logout', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PD' })).toHaveCount(0);
});

test('register with existing email shows error', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register', exact: true }).click();

  await page.getByPlaceholder('Full name').fill('Kai Chen');
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('email already registered')).toBeVisible();
});

test('register page links to login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register', exact: true }).click();
  await page.getByRole('main').getByText('Login', { exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('diner dashboard shows order history', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.getByText('Here is your history of all the good times.')).toBeVisible();
  const order = page.getByRole('row', { name: '17' });
  await expect(order).toContainText('0.008 ₿');
  await expect(order).toContainText('2024-06-05');
});

test('about and history pages', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
});

test('unknown page shows not found', async ({ page }) => {
  await basicInit(page);
  await page.goto('/no-such-pizza');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('service docs', async ({ page }) => {
  await basicInit(page);
  await page.goto('/docs');

  await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '[GET] /api/order/menu' })).toBeVisible();
  await expect(page.getByText('Get the pizza menu')).toBeVisible();
});

test('factory docs', async ({ page }) => {
  await basicInit(page);
  await page.goto('/docs/factory');

  await expect(page.getByRole('heading', { name: '🔐 [POST] /api/order' })).toBeVisible();
  await expect(page.getByText('Create a JWT pizza')).toBeVisible();
});
