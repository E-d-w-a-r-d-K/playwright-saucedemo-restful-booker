import { type Locator, type Page } from '@playwright/test';
import { type DynamicCatalogMode } from '../../data/dynamicCatalog';
import { ROUTES } from '../../data/routes';
import { step } from '../../utils/step';

/** The header shown on every page after login: burger menu, page title and cart icon. */
export class Header {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  /** The second header line: "Products", "Your Cart", "Dynamic Catalog - Spinner"… */
  readonly title: Locator;
  readonly aboutLink: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.title = page.getByTestId('title');
    this.aboutLink = page.getByTestId('about-sidebar-link');
  }

  async openCart() {
    await step('Open the cart from the header', () => this.cartLink.click());
  }

  async openMenu() {
    await step('Open the menu', () => this.page.getByRole('button', { name: 'Open Menu' }).click());
  }

  async closeMenu() {
    await step('Close the menu', () => this.page.getByRole('button', { name: 'Close Menu' }).click());
  }

  async openAbout() {
    await step('Open "About" from the menu', async () => {
      await this.openMenu();
      await this.aboutLink.click();
    });
  }

  async openAllItems() {
    await step('Open "All Items" from the menu', async () => {
      await this.openMenu();
      await this.page.getByTestId('inventory-sidebar-link').click();
    });
  }

  async openDynamicCatalog(mode: DynamicCatalogMode) {
    await step(`Open "Dynamic Catalog → ${mode}" from the menu`, async () => {
      await this.openMenu();
      await this.page.getByTestId('dynamic-catalog-sidebar-link').click();
      await this.page.getByTestId(`dynamic-catalog-${mode}-link`).click();
      await this.page.waitForURL(ROUTES.dynamicCatalog[mode]);
    });
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
}
