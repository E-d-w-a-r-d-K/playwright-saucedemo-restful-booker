import { test as base, expect } from '@playwright/test';
import { env } from '../../config/env';
import { type Username, USERS } from '../data/users';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { Header } from '../pages/components/Header';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { loginViaSession } from '../utils/session';
import { step } from '../utils/step';

interface UiFixtures {
  loginPage: LoginPage;
  inventory: InventoryPage;
  productPage: ProductPage;
  cart: CartPage;
  checkout: CheckoutPage;
  header: Header;
  /** Logs the given user in through the session cookie (no form) and opens the inventory page. */
  loginAs: (user: Username) => Promise<InventoryPage>;
  /** standard_user is logged in (session cookie, no form) and the inventory page is open. */
  loggedIn: InventoryPage;
}

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventory: async ({ page }, use) => use(new InventoryPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cart: async ({ page }, use) => use(new CartPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  header: async ({ page }, use) => use(new Header(page)),
  loginAs: async ({ context, inventory }, use) => {
    await use(user =>
      step(`Log in as "${user}" (session cookie, no form) and open the inventory`, async () => {
        await loginViaSession(context, env.ui.baseUrl, user);
        await inventory.open();
        await expect(inventory.title, 'the inventory page is open').toHaveText('Products');
        return inventory;
      }),
    );
  },
  loggedIn: async ({ loginAs }, use) => use(await loginAs(USERS.standard)),
});

export { expect };
