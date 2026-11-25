import { expect, test } from '../../src/fixtures/ui';
import {
  DYNAMIC_CATALOG_TITLES,
  DYNAMIC_CATALOG_VIEWPORT,
  type DynamicCatalogMode,
  LAZY_LOAD_BATCH,
  LAZY_LOAD_FIRST_CARDS,
  LAZY_LOAD_INITIAL,
  LAZY_LOAD_PLACEHOLDER,
  SIZE_SUFFIX,
  SLIDER_INTERVAL_MS,
  SPINNER_DELAY_MS,
} from '../../src/data/dynamicCatalog';
import { CATALOGUE, type Product, product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { advanceClock, freezeClock, pinRandom } from '../../src/utils/clock';
import { formatPrice } from '../../src/utils/money';
import { area, EPIC } from '../../src/utils/report';

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
/** "Sauce Labs Fleece Jacket (XS)" is the catalogue's Fleece Jacket in a size: same product, same price. */
const catalogueEntry = (name: string): Product => ({ name, price: product(name.replace(SIZE_SUFFIX, '')).price });
const isCatalogueProduct = (item: Product): boolean =>
  CATALOGUE.some(c => c.name === item.name.replace(SIZE_SUFFIX, '') && c.price === item.price);

test.describe('Dynamic catalogue', area(EPIC.ui, 'Dynamic catalogue'), () => {
  test.use({ viewport: DYNAMIC_CATALOG_VIEWPORT });

  const modes = Object.keys(DYNAMIC_CATALOG_TITLES) as DynamicCatalogMode[];
  for (const mode of modes) {
    test(`menu "Dynamic Catalog → ${mode}" opens its page`, async ({ page, loggedIn, header }) => {
      // Act
      await header.openDynamicCatalog(mode);

      // Assert
      await expect(page, `the ${mode} page is open`).toHaveURL(ROUTES.dynamicCatalog[mode]);
      await expect(header.title, 'the page title names the mode').toHaveText(DYNAMIC_CATALOG_TITLES[mode]);
    });
  }

  // The delay is random: Math.random is pinned to each end of its range, and time is moved by the test,
  // so both boundaries are checked exactly — one millisecond before, and at the boundary.
  const delays = [
    { end: 'shortest', random: 0, delay: SPINNER_DELAY_MS.min },
    { end: 'longest', random: 0.9999999, delay: SPINNER_DELAY_MS.max },
  ];
  for (const { end, random, delay } of delays) {
    test(`Spinner: the ${end} delay (${delay} ms) shows a spinner until its last millisecond, then every product`, async ({ page, loggedIn, dynamicCatalog }) => {
      // Arrange
      await pinRandom(page, random);
      await freezeClock(page);
      await dynamicCatalog.open('spinner');
      await expect(dynamicCatalog.spinner, 'the loading spinner is shown').toBeVisible();

      // Act + Assert: one millisecond before the delay ends nothing has loaded
      await advanceClock(page, delay - 1);
      await expect(dynamicCatalog.spinner, 'the spinner is still shown').toBeVisible();
      await expect(dynamicCatalog.spinnerGrid, 'no products yet').toBeHidden();

      // Act + Assert: at the delay the products replace the spinner
      await advanceClock(page, 1);
      await expect(dynamicCatalog.spinner, 'the spinner is gone').toBeHidden();
      await expect
        .poll(async () => (await dynamicCatalog.spinnerProducts()).sort(byName), { message: 'the grid shows every catalogue product with its price' })
        .toEqual([...CATALOGUE].sort(byName));
    });
  }

  test('Lazy Load: a card loads when it comes into view, and reaching the end adds a batch', async ({ loggedIn, dynamicCatalog }) => {
    // Arrange: at 1280×720 the last cards of the first batches are below the fold
    await dynamicCatalog.open('lazy-load');
    await expect(dynamicCatalog.lazyItems, 'the first batches are shown').toHaveCount(LAZY_LOAD_INITIAL);
    const last = LAZY_LOAD_INITIAL - 1;
    await expect(dynamicCatalog.lazyCard(last), 'a card out of view is a placeholder').toHaveText(LAZY_LOAD_PLACEHOLDER);

    // Act: bring every card of the first batches into view, one by one
    await dynamicCatalog.showLazyCards(0, last);

    // Assert: the cards are the site's products in its order, each at the catalogue price
    await expect
      .poll(async () => (await dynamicCatalog.lazyProducts()).slice(0, LAZY_LOAD_INITIAL), { message: 'the first cards, in order, with catalogue prices' })
      .toEqual(LAZY_LOAD_FIRST_CARDS.map(catalogueEntry));
    // the last card brought the end of the list into view: exactly one more batch
    await expect(dynamicCatalog.lazyItems, `one more batch of ${LAZY_LOAD_BATCH} is added`).toHaveCount(LAZY_LOAD_INITIAL + LAZY_LOAD_BATCH);

    // Act + Assert: the added cards load too, and each is a catalogue product at the catalogue price
    await dynamicCatalog.showLazyCards(LAZY_LOAD_INITIAL, LAZY_LOAD_INITIAL + LAZY_LOAD_BATCH - 1);
    await expect
      .poll(async () => (await dynamicCatalog.lazyProducts()).slice(LAZY_LOAD_INITIAL, LAZY_LOAD_INITIAL + LAZY_LOAD_BATCH).filter(p => !isCatalogueProduct(p)), {
        message: 'every added card is a catalogue product (or its size) at the catalogue price',
      })
      .toEqual([]);
  });

  test('Slider: each dot shows its product with the catalogue price and becomes the only current dot', async ({ page, loggedIn, dynamicCatalog }) => {
    // Arrange: a frozen clock keeps the autoplay from moving the slider during the checks
    await freezeClock(page);
    await dynamicCatalog.open('slider');
    const dotProducts = await dynamicCatalog.sliderDotProducts();
    expect([...dotProducts].sort(), 'the dots offer every catalogue product').toEqual(CATALOGUE.map(p => p.name).sort());

    // From the last dot back: the first dot is current on a fresh page, so starting there would prove nothing
    for (let index = dotProducts.length - 1; index >= 0; index--) {
      const name = dotProducts[index];

      // Act
      await dynamicCatalog.chooseInSlider(index);

      // Assert
      await expect(dynamicCatalog.sliderName, `the slider shows "${name}"`).toHaveText(name);
      await expect(dynamicCatalog.sliderPrice, 'with its catalogue price').toHaveText(formatPrice(product(name).price));
      await expect(dynamicCatalog.sliderDot(index), 'its dot is current').toHaveAttribute('aria-current', 'true');
      await expect(dynamicCatalog.currentSliderDots, 'and it is the only current dot').toHaveCount(1);
    }
  });

  test('Slider: autoplay moves to the next product every 2 s and wraps around after the last', async ({ page, loggedIn, dynamicCatalog }) => {
    // Arrange
    await freezeClock(page);
    await dynamicCatalog.open('slider');
    const order = await dynamicCatalog.sliderDotProducts();
    await expect(dynamicCatalog.sliderName, 'the slider starts with the first product').toHaveText(order[0]);

    // Act + Assert: the boundary — not a millisecond early
    await advanceClock(page, SLIDER_INTERVAL_MS - 1);
    await expect(dynamicCatalog.sliderName, 'still the first product just before the interval').toHaveText(order[0]);

    // Act + Assert: every interval moves exactly one product on, then back to the first
    await advanceClock(page, 1);
    await expect(dynamicCatalog.sliderName, 'the second product at the interval').toHaveText(order[1]);
    for (let shown = 2; shown <= order.length; shown++) {
      await advanceClock(page, SLIDER_INTERVAL_MS - 1);
      await expect(dynamicCatalog.sliderName, 'unchanged just before the next interval').toHaveText(order[shown - 1]);
      await advanceClock(page, 1);
      const expected = order[shown % order.length];
      await expect(dynamicCatalog.sliderName, `the slider shows "${expected}"`).toHaveText(expected);
    }
  });
});
