import { test as base, expect } from '@playwright/test';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { PASSWORD, USERS } from './support/data';

interface Pages {
  loginPage: LoginPage;
  inventory: InventoryPage;
  cart: CartPage;
  checkout: CheckoutPage;
  /** Logs standard_user in through the form and lands on the inventory page. */
  loggedIn: InventoryPage;
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventory: async ({ page }, use) => use(new InventoryPage(page)),
  cart: async ({ page }, use) => use(new CartPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  loggedIn: async ({ page, loginPage, inventory }, use) => {
    await loginPage.open();
    await loginPage.login(USERS.standard, PASSWORD);
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await use(inventory);
  },
});

export { expect };
