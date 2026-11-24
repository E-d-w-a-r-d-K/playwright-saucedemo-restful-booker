import { type Locator, type Page } from '@playwright/test';
import { type Product } from '../data/products';
import { parsePrice } from '../utils/money';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async open() {
    await this.page.goto('/cart.html');
  }

  async products(): Promise<Product[]> {
    const names = await this.items.getByTestId('inventory-item-name').allTextContents();
    const prices = await this.items.getByTestId('inventory-item-price').allTextContents();
    return names.map((name, i) => ({ name, price: parsePrice(prices[i]) }));
  }

  async remove(name: string) {
    await this.items
      .filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
