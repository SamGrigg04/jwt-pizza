import { test, expect } from './testSetup';
import { basicInit, login } from './mockService';

test('home page', async ({ page }) => {
  await basicInit(page);

  expect(await page.title()).toBe('JWT Pizza');
  await expect(page.getByRole('button', { name: 'Order now' })).toBeVisible();
});

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('login with bad password shows error', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'wrong');

  await expect(page.getByText('unknown user')).toBeVisible();
  await expect(page.getByRole('link', { name: 'KC' })).toHaveCount(0);
});

test('stale token is discarded', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'expired'));
  await basicInit(page);

  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('0.008')).toBeVisible();
});

test('verify a valid pizza JWT', async ({ page }) => {
  await basicInit(page);
  await login(page, 'd@jwt.com', 'a');
  await page.getByRole('link', { name: 'Order', exact: true }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  await expect(page.getByRole('main')).toContainText('Send me that pizza right now!');
  await expect(page.locator('tfoot')).toContainText('1 pie');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('23');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('#hs-jwt-modal h3')).toHaveText('JWT Pizza - valid');
  await expect(page.locator('#hs-jwt-modal pre')).toContainText('sgrigg42');

  const modal = page.locator('#hs-jwt-modal');
  await expect(modal).toHaveClass(/open/);
  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal).toBeHidden();
  await page.getByRole('button', { name: 'Order more' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
});

test('verify an invalid pizza JWT', async ({ page }) => {
  await basicInit(page);
  await page.goto('/delivery');

  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('#hs-jwt-modal h3')).toHaveText('JWT Pizza - invalid');
  await expect(page.locator('#hs-jwt-modal pre')).toContainText('Looks like you have a bad pizza!');
});

test('payment failure shows error and cancel returns to menu', async ({ page }) => {
  await basicInit(page);
  await page.route('*/**/api/order', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ status: 500, json: { message: 'Pizza oven is on fire' } });
  });

  await login(page, 'd@jwt.com', 'a');
  await page.getByRole('link', { name: 'Order', exact: true }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('⚠️ Pizza oven is on fire')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 1');
});
