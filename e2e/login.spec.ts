import { expect, test } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'LOGIN' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('unauthenticated employee routes redirect to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'LOGIN' })).toBeVisible();
});

test('unauthenticated admin routes redirect to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'LOGIN' })).toBeVisible();
});

test('unauthenticated super-admin routes redirect to login', async ({ page }) => {
  await page.goto('/super-admin');
  await expect(page.getByRole('heading', { name: 'LOGIN' })).toBeVisible();
});
