import { type Locator, type Page } from '@playwright/test';
import { step } from '../utils/step';

/** A single product page: /inventory-item.html?id=N */
export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly backButton: Locator;
  /** The cart button, whatever it currently says ("Add to cart" or "Remove"). */
  readonly cartButton: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.description = page.getByTestId('inventory-item-desc');
    this.backButton = page.getByTestId('back-to-products');
    this.cartButton = page.getByTestId(/^(add-to-cart|remove)$/);
  }

  async backToProducts() {
    await step('Press "Back to products"', () => this.backButton.click());
  }

  // data-test "add-to-cart" / "remove" exactly: catalogue cards use "add-to-cart-<product>", so these match only here
  async addToCart() {
    await step('Press "Add to cart" on the product page', () => this.page.getByTestId('add-to-cart').click());
  }

  async removeFromCart() {
    await step('Press "Remove" on the product page', () => this.page.getByTestId('remove').click());
  }
}
