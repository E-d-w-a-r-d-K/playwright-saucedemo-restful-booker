import { type Locator, type Page } from '@playwright/test';
import { type DynamicCatalogMode } from '../data/dynamicCatalog';
import { type Product } from '../data/products';
import { settle } from '../utils/clock';
import { parsePrice } from '../utils/money';
import { step } from '../utils/step';

/** The three "Dynamic Catalog" pages: Lazy Load (infinite list), Spinner (delayed grid) and Slider (autoplay). */
export class DynamicCatalogPage {
  // Spinner
  readonly spinner: Locator;
  readonly spinnerGrid: Locator;
  readonly spinnerItems: Locator;
  // Lazy Load
  readonly lazyItems: Locator;
  private readonly lazyEnd: Locator;
  // Slider
  readonly sliderName: Locator;
  readonly sliderPrice: Locator;
  readonly sliderDots: Locator;
  /** Dots marked as the current one (aria-current="true"); exactly one is expected. */
  readonly currentSliderDots: Locator;

  constructor(private readonly page: Page) {
    this.spinner = page.getByTestId('dynamic-catalog-spinner');
    this.spinnerGrid = page.getByTestId('dynamic-catalog-spinner-grid');
    this.spinnerItems = page.getByTestId(/^spinner-item-\d+$/);
    this.lazyItems = page.getByTestId(/^lazy-load-item-\d+$/);
    this.lazyEnd = page.getByTestId('dynamic-catalog-lazy-load-sentinel');
    this.sliderName = page.getByTestId('dynamic-catalog-slider-item-name');
    this.sliderPrice = page.getByTestId('dynamic-catalog-slider-item-price');
    this.sliderDots = page.getByTestId(/^dynamic-catalog-slider-dot-\d+$/);
    this.currentSliderDots = this.sliderDots.and(page.locator('[aria-current="true"]'));
  }

  /** Opens the page and waits until it has rendered and registered its timers and observers. */
  async open(mode: DynamicCatalogMode) {
    await step(`Open the "${mode}" dynamic catalogue page by URL`, async () => {
      await this.page.goto(`/dynamic-catalog-${mode}.html`);
      await this.page.getByTestId(`dynamic-catalog-${mode}-container`).waitFor();
      await settle(this.page);
    });
  }

  /** Products of the spinner grid, in the order shown. */
  async spinnerProducts(): Promise<Product[]> {
    return readProducts(this.spinnerItems);
  }

  /** Products of the lazy list, in the order shown; an item still loading reads as its placeholder text ("Loading…"). */
  async lazyProducts(): Promise<Product[]> {
    return readProducts(this.lazyItems);
  }

  async scrollToEndOfList() {
    await step('Scroll to the end of the lazy list', () => this.lazyEnd.scrollIntoViewIfNeeded());
  }

  /** A lazy card: "Loading…" until it has been in view, then the product's picture, name and price. */
  lazyCard(index: number): Locator {
    return this.page.getByTestId(`lazy-load-item-${index}`);
  }

  /** Brings the cards from..to (inclusive) into view one by one, so each of them loads. */
  async showLazyCards(from: number, to: number) {
    await step(`Scroll lazy cards #${from}–#${to} into view one by one`, async () => {
      for (let index = from; index <= to; index++) await this.lazyCard(index).scrollIntoViewIfNeeded();
    });
  }

  /** Product names the slider dots offer, in dot order ("Show Sauce Labs Bike Light" → "Sauce Labs Bike Light"). */
  async sliderDotProducts(): Promise<string[]> {
    await this.sliderDots.first().waitFor();
    const labels = await this.sliderDots.evaluateAll(dots => dots.map(d => d.getAttribute('aria-label') ?? ''));
    return labels.map(label => label.replace(/^Show /, ''));
  }

  sliderDot(index: number): Locator {
    return this.page.getByTestId(`dynamic-catalog-slider-dot-${index}`);
  }

  async chooseInSlider(index: number) {
    const label = (await this.sliderDot(index).getAttribute('aria-label')) ?? `dot ${index}`;
    await step(`Slider: press the dot "${label}"`, async () => {
      await this.sliderDot(index).click();
      await settle(this.page);
    });
  }
}

/** One entry per card, read in a single pass so names and prices cannot come from different renders. */
async function readProducts(items: Locator): Promise<Product[]> {
  const cards = await items.evaluateAll(els =>
    els.map(card => ({
      name: card.querySelector('[data-test$="-name"]')?.textContent ?? (card.textContent ?? '').trim(),
      price: card.querySelector('[data-test$="-price"]')?.textContent ?? null,
    })),
  );
  return cards.map(({ name, price }) => ({ name, price: price === null ? NaN : parsePrice(price) }));
}
