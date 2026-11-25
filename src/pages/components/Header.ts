import { type Locator, type Page } from '@playwright/test';
import { step } from '../../utils/step';

/** The header shown on every page after login: burger menu and cart icon. */
export class Header {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async openCart() {
    await step('Open the cart from the header', () => this.cartLink.click());
  }

  async logout() {
    await step('Log out from the menu', async () => {
      await this.openMenu();
      await this.page.getByTestId('logout-sidebar-link').click();
    });
  }

  async resetAppState() {
    await step('Reset App State from the menu', async () => {
      await this.openMenu();
      await this.page.getByTestId('reset-sidebar-link').click();
    });
  }

  private async openMenu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }
}
