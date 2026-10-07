import { Page } from '@playwright/test';
import { expect } from './testSetup';
import { Franchise, Order, Role, User } from '../src/service/pizzaService';

const validJwt = 'eyJpYXQ';

// Stateful mock of the JWT Pizza Service so each test runs against a fresh, predictable backend.
export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  let nextId = 100;

  const validUsers: Record<string, User> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'f@jwt.com': {
      id: '4',
      name: 'Fran Chise',
      email: 'f@jwt.com',
      password: 'franchisee',
      roles: [{ role: Role.Diner }, { role: Role.Franchisee, objectId: '2' }],
    },
    'a@jwt.com': { id: '1', name: 'Mama Ricci', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
  };

  const franchises: Franchise[] = [
    {
      id: '2',
      name: 'LotaPizza',
      admins: [{ id: '4', name: 'Fran Chise', email: 'f@jwt.com' }],
      stores: [
        { id: '4', name: 'Lehi', totalRevenue: 0.05 },
        { id: '5', name: 'Springville', totalRevenue: 0.25 },
        { id: '6', name: 'American Fork', totalRevenue: 1.5 },
      ],
    },
    { id: '3', name: 'PizzaCorp', admins: [], stores: [{ id: '7', name: 'Spanish Fork', totalRevenue: 3 }] },
    { id: '4', name: 'topSpot', admins: [], stores: [] },
    { id: '5', name: 'SliceCity', admins: [], stores: [] },
  ];

  const orderHistory: Record<string, Order[]> = {
    '3': [
      {
        id: '17',
        franchiseId: '2',
        storeId: '4',
        date: '2024-06-05T05:14:40.000Z',
        items: [
          { menuId: '1', description: 'Veggie', price: 0.0038 },
          { menuId: '2', description: 'Pepperoni', price: 0.0042 },
        ],
      },
    ],
  };

  function findFranchise(id: string) {
    const franchise = franchises.find((f) => f.id === id);
    expect(franchise, `franchise ${id} should exist`).toBeDefined();
    return franchise!;
  }

  // Login (PUT), register (POST), and logout (DELETE)
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
      return;
    }

    const req = route.request().postDataJSON();
    if (method === 'POST') {
      if (validUsers[req.email]) {
        await route.fulfill({ status: 409, json: { message: 'email already registered' } });
        return;
      }
      const user: User = { id: String(nextId++), name: req.name, email: req.email, password: req.password, roles: [{ role: Role.Diner }] };
      validUsers[req.email] = user;
      loggedInUser = user;
      await route.fulfill({ json: { user, token: 'abcdef' } });
      return;
    }

    expect(method).toBe('PUT');
    const user = validUsers[req.email];
    if (!user || user.password !== req.password) {
      await route.fulfill({ status: 401, json: { message: 'unknown user' } });
      return;
    }
    loggedInUser = user;
    await route.fulfill({ json: { user, token: 'abcdef' } });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    if (!loggedInUser) {
      await route.fulfill({ status: 401, json: { message: 'unauthorized' } });
      return;
    }
    await route.fulfill({ json: loggedInUser });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Order history (GET) and placing an order (POST)
  await page.route('*/**/api/order', async (route) => {
    const method = route.request().method();
    const dinerId = loggedInUser?.id ?? '';
    if (method === 'GET') {
      await route.fulfill({ json: { id: '1', dinerId, orders: orderHistory[dinerId] ?? [] } });
      return;
    }

    expect(method).toBe('POST');
    const orderReq = route.request().postDataJSON();
    const order = { ...orderReq, id: 23, date: '2024-06-06T12:00:00.000Z' };
    orderHistory[dinerId] = [...(orderHistory[dinerId] ?? []), order];
    await route.fulfill({ json: { order, jwt: validJwt } });
  });

  // Pizza factory JWT verification
  await page.route('*/**/api/order/verify', async (route) => {
    expect(route.request().method()).toBe('POST');
    const { jwt } = route.request().postDataJSON();
    if (jwt !== validJwt) {
      await route.fulfill({ status: 401, json: { message: 'invalid' } });
      return;
    }
    await route.fulfill({ json: { message: 'valid', payload: { vendor: { id: 'sgrigg42', name: 'Sam Grigg' }, order: { id: 23 } } } });
  });

  // List franchises (GET with paging and name filter) and create a franchise (POST)
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const req = route.request().postDataJSON();
      const admins = (req.admins ?? []).map((a: { email: string }) => {
        const user = validUsers[a.email];
        return { email: a.email, id: user?.id ?? String(nextId++), name: user?.name ?? 'unknown' };
      });
      const franchise: Franchise = { id: String(nextId++), name: req.name, admins, stores: [] };
      franchises.push(franchise);
      await route.fulfill({ json: franchise });
      return;
    }

    expect(method).toBe('GET');
    const params = new URL(route.request().url()).searchParams;
    const pageNumber = Number(params.get('page') ?? 0);
    const limit = Number(params.get('limit') ?? 10);
    const namePattern = (params.get('name') ?? '*').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const matching = franchises.filter((f) => new RegExp(`^${namePattern}$`, 'i').test(f.name));
    const start = pageNumber * limit;
    await route.fulfill({ json: { franchises: matching.slice(start, start + limit), more: matching.length > start + limit } });
  });

  // Franchises for a user (GET /api/franchise/:userId) and close a franchise (DELETE /api/franchise/:franchiseId)
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    const id = new URL(route.request().url()).pathname.split('/').pop()!;
    const method = route.request().method();
    if (method === 'DELETE') {
      franchises.splice(franchises.indexOf(findFranchise(id)), 1);
      await route.fulfill({ json: { message: 'franchise deleted' } });
      return;
    }

    expect(method).toBe('GET');
    await route.fulfill({ json: franchises.filter((f) => f.admins?.some((a) => a.id === id)) });
  });

  // Create a store (POST) and close a store (DELETE)
  await page.route(/\/api\/franchise\/\d+\/store(\/\d+)?$/, async (route) => {
    const [, franchiseId, storeId] = new URL(route.request().url()).pathname.match(/\/api\/franchise\/(\d+)\/store(?:\/(\d+))?$/)!;
    const franchise = findFranchise(franchiseId);
    const method = route.request().method();
    if (method === 'DELETE') {
      franchise.stores = franchise.stores.filter((s) => s.id !== storeId);
      await route.fulfill({ json: { message: 'store deleted' } });
      return;
    }

    expect(method).toBe('POST');
    const store = { id: String(nextId++), name: route.request().postDataJSON().name, totalRevenue: 0 };
    franchise.stores.push(store);
    await route.fulfill({ json: store });
  });

  // API documentation for both the service and the factory
  await page.route('*/**/api/docs', async (route) => {
    expect(route.request().method()).toBe('GET');
    const isFactory = route.request().url().includes('pizza-factory');
    const endpoints = isFactory
      ? [{ method: 'POST', path: '/api/order', requiresAuth: true, description: 'Create a JWT pizza', example: 'curl -X POST /api/order', response: { jwt: 'JWT here' } }]
      : [{ method: 'GET', path: '/api/order/menu', requiresAuth: false, description: 'Get the pizza menu', example: 'curl /api/order/menu', response: [{ id: 1, title: 'Veggie' }] }];
    await route.fulfill({ json: { endpoints } });
  });

  await page.goto('/');
}

export async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}
