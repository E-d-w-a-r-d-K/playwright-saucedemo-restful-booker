import { type Locator, type Page } from '@playwright/test';
import { type Product } from '../data/products';
import { ROUTES } from '../data/routes';
import { parsePrice } from '../utils/money';
import { step } from '../utils/step';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

const SORT_LABELS: Record<SortOption, string> = {
  az: 'Name (A to Z)',
  za: 'Name (Z to A)',
  lohi: 'Price (low to high)',
  hilo: 'Price (high to low)',
};

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
    await step('Open the inventory page by URL', () => this.page.goto('/inventory.html'));
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
    await step(`Add "${name}" to the cart`, () => this.card(name).getByRole('button', { name: 'Add to cart' }).click());
  }

  async removeFromCart(name: string) {
    await step(`Remove "${name}" on the inventory page`, () =>
      this.card(name).getByRole('button', { name: 'Remove' }).click(),
    );
  }

  async sortBy(option: SortOption) {
    await step(`Sort the products: ${SORT_LABELS[option]}`, () => this.sort.selectOption(option));
  }

  async openProduct(name: string) {
    await step(`Open "${name}" by its name`, async () => {
      await this.card(name).getByTestId('inventory-item-name').click();
      // the action ends on the product page: until then the inventory names also match the product page locators
      await this.page.waitForURL(ROUTES.product);
    });
  }

  /** Opens the product page through the picture link (data-test="item-<id>-img-link"). */
  async openProductByImage(name: string) {
    await step(`Open "${name}" by its picture`, async () => {
      await this.card(name).getByTestId(/^item-\d+-img-link$/).click();
      await this.page.waitForURL(ROUTES.product);
    });
  }

  private card(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) });
  }
}
