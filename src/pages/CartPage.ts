import { type Locator, type Page } from '@playwright/test';
import { type Product } from '../data/products';
import { parsePrice } from '../utils/money';
import { step } from '../utils/step';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async open() {
    await step('Open the cart page by URL', () => this.page.goto('/cart.html'));
  }

  async continueShopping() {
    await step('Press "Continue Shopping"', () => this.page.getByTestId('continue-shopping').click());
  }

  async products(): Promise<Product[]> {
    const names = await this.items.getByTestId('inventory-item-name').allTextContents();
    const prices = await this.items.getByTestId('inventory-item-price').allTextContents();
    return names.map((name, i) => ({ name, price: parsePrice(prices[i]) }));
  }

  async remove(name: string) {
    await step(`Remove "${name}" in the cart`, () =>
      this.items
        .filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) })
        .getByRole('button', { name: 'Remove' })
        .click(),
    );
  }

  async checkout() {
    await step('Press Checkout', () => this.checkoutButton.click());
  }
}
