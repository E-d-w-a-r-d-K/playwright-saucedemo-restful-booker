import { type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../support/money';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export interface Product {
  name: string;
  price: number;
}

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly sort: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.sort = page.getByTestId('product-sort-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async open() {
    await this.page.goto('/inventory.html');
  }

  /** Name and numeric price of every card, in the order shown on the page. */
  async products(): Promise<Product[]> {
    const names = await this.items.getByTestId('inventory-item-name').allTextContents();
    const prices = await this.items.getByTestId('inventory-item-price').allTextContents();
    return names.map((name, i) => ({ name, price: parsePrice(prices[i]) }));
  }

  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) });
  }

  async addToCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption) {
    await this.sort.selectOption(option);
  }

  async openDetails(name: string) {
    await this.item(name).getByTestId('inventory-item-name').click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async openMenu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }

  async logout() {
    await this.openMenu();
    await this.page.getByTestId('logout-sidebar-link').click();
  }

  async resetAppState() {
    await this.openMenu();
    await this.page.getByTestId('reset-sidebar-link').click();
  }
}
