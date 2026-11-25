import { type Locator, type Page } from '@playwright/test';
import { step } from '../utils/step';

/** A single product page: /inventory-item.html?id=N */
export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.description = page.getByTestId('inventory-item-desc');
    this.backButton = page.getByTestId('back-to-products');
  }

  async backToProducts() {
    await step('Press "Back to products"', () => this.backButton.click());
  }
}
