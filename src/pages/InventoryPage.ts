import { type Locator, type Page } from '@playwright/test';
import { type Product } from '../data/products';
import { parsePrice } from '../utils/money';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly sort: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.sort = page.getByTestId('product-sort-container');
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

  async description(name: string): Promise<string> {
    return (await this.card(name).getByTestId('inventory-item-desc').textContent()) ?? '';
  }

  /** Source of the product picture, e.g. "/assets/sauce-backpack-1200x1500-….jpg". */
  async imageSource(name: string): Promise<string> {
    return (await this.card(name).getByRole('img').getAttribute('src')) ?? '';
  }

  /** The card's cart button, whatever it currently says ("Add to cart" or "Remove"). */
  cartButton(name: string): Locator {
    // the card holds more than one button-like element, so match the cart button by its two possible labels
    return this.card(name).getByRole('button', { name: /^(Add to cart|Remove)$/ });
  }

  async addToCart(name: string) {
    await this.card(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(name: string) {
    await this.card(name).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption) {
    await this.sort.selectOption(option);
  }

  async openProduct(name: string) {
    await this.card(name).getByTestId('inventory-item-name').click();
  }

  /** Opens the product page through the picture link (data-test="item-<id>-img-link"). */
  async openProductByImage(name: string) {
    await this.card(name).getByTestId(/^item-\d+-img-link$/).click();
  }

  private card(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) });
  }
}
