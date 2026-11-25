import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER, WHITESPACE_CUSTOMER } from '../../src/data/checkout';
import { MESSAGES } from '../../src/data/messages';
import { DYNAMIC_CATALOG_VIEWPORT, LAZY_LOAD_BATCH, LAZY_LOAD_DUPLICATE, LAZY_LOAD_INITIAL, SLIDER_INTERVAL_MS } from '../../src/data/dynamicCatalog';
import { type Product, product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { advanceClock, freezeClock } from '../../src/utils/clock';
import { knownBug } from '../../src/utils/knownBug';
import { area, EPIC } from '../../src/utils/report';

/*
 * Each test checks the CORRECT behaviour and, while it does not hold, requires the OBSERVED buggy behaviour
 * (see src/utils/knownBug.ts). The test is green only when exactly this bug is present;
 * any other failure — or a fixed bug — makes it red. Bug reports: README.md, "Знайдені баги".
 */
test.describe('Known bugs', { tag: '@known-bug', ...area(EPIC.ui, 'Known bugs') }, () => {
  test('BUG-UI-1: an order can be placed with an empty cart', async ({ page, header, cart, checkout, loggedIn }) => {
    // Arrange: logged in, nothing added
    await header.openCart();
    await expect(cart.items, 'the cart is empty').toHaveCount(0);

    // Act + Assert. The correct behaviour is a positive state (Checkout is unavailable), not "still on the cart":
    // right after a click the page has not navigated yet, so "still on the cart" would hold by accident.
    await knownBug('BUG-UI-1', {
      severity: 'critical',
      correct: () => expect(cart.checkoutButton, 'Checkout is disabled for an empty cart').toBeDisabled(),
      observed: async () => {
        await cart.checkout();
        await expect(page, 'checkout step one (customer form) is open').toHaveURL(ROUTES.checkoutStepOne);
        await checkout.fillCustomer(CUSTOMER);
        expect(await checkout.totals(), 'the order totals are all $0').toEqual({ itemTotal: 0, tax: 0, total: 0 });
        await checkout.finish();
        await expect(checkout.completeHeader, 'the order is confirmed').toHaveText(MESSAGES.orderComplete);
      },
    });
  });

  test('BUG-UI-2: checkout accepts names and postal code made of spaces', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(product('Sauce Labs Backpack').name);
    await header.openCart();
    await cart.checkout();

    // Act
    await checkout.fillCustomer(WHITESPACE_CUSTOMER);

    // Assert
    await knownBug('BUG-UI-2', {
      severity: 'normal',
      correct: async () => {
        await expect(checkout.error, 'the checkout form shows the error').toHaveText(MESSAGES.firstNameRequired);
        await expect(page, 'checkout step one (customer form) is open').toHaveURL(ROUTES.checkoutStepOne);
      },
      observed: () => expect(page, 'checkout step two (overview) is open').toHaveURL(ROUTES.checkoutStepTwo),
    });
  });

  test('BUG-UI-3: Reset App State leaves the "Remove" button on the product', async ({ loggedIn, header }) => {
    // Arrange
    const onesie = product('Sauce Labs Onesie').name;
    await loggedIn.addToCart(onesie);

    // Act
    await header.resetAppState();

    // Assert
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
    await knownBug('BUG-UI-3', {
      severity: 'minor',
      correct: () => expect(loggedIn.cartButton(onesie), 'the product button says "Add to cart" again').toHaveText('Add to cart'),
      observed: () => expect(loggedIn.cartButton(onesie), 'the product button still says "Remove"').toHaveText('Remove'),
    });
  });

  test.describe('Dynamic catalogue', () => {
    test.use({ viewport: DYNAMIC_CATALOG_VIEWPORT });

    test('BUG-UI-4: the slider leaves a product the user just chose before the autoplay interval', async ({ page, loggedIn, dynamicCatalog }) => {
      // Arrange: a frozen clock, so "10 ms before the next autoplay tick" is exact
      await freezeClock(page);
      await dynamicCatalog.open('slider');
      const order = await dynamicCatalog.sliderDotProducts();
      const chosen = order.length - 2; // any dot but the last, so "the next product" needs no wrap-around
      await advanceClock(page, SLIDER_INTERVAL_MS - 10);

      // Act: the user picks a product, then a short moment passes
      await dynamicCatalog.chooseInSlider(chosen);
      await expect(dynamicCatalog.sliderName, 'the chosen product is shown').toHaveText(order[chosen]);
      await advanceClock(page, 100);

      // Assert
      await knownBug('BUG-UI-4', {
        severity: 'minor',
        correct: () => expect(dynamicCatalog.sliderName, 'the chosen product stays on screen').toHaveText(order[chosen], { timeout: 1000 }),
        observed: () => expect(dynamicCatalog.sliderName, 'the slider already moved to the next product').toHaveText(order[chosen + 1]),
      });
    });

    test('BUG-UI-5: the lazy-load catalogue lists one product twice in a row', async ({ loggedIn, dynamicCatalog }) => {
      // Arrange
      await dynamicCatalog.open('lazy-load');
      await expect(dynamicCatalog.lazyItems, 'the first batches are shown').toHaveCount(LAZY_LOAD_INITIAL);

      // Act: load one more batch, so the list is long enough to hold the duplicate, and bring its cards into view
      await dynamicCatalog.scrollToEndOfList();
      const shown = LAZY_LOAD_INITIAL + LAZY_LOAD_BATCH;
      await expect(dynamicCatalog.lazyItems, 'one more batch is added').toHaveCount(shown);
      await dynamicCatalog.showLazyCards(0, shown - 1);
      const repeats = async () => adjacentRepeats((await dynamicCatalog.lazyProducts()).slice(0, shown));

      // Assert
      await knownBug('BUG-UI-5', {
        severity: 'minor',
        correct: () => expect.poll(repeats, { message: 'no card repeats the card before it', timeout: 2000 }).toEqual([]),
        observed: () => expect.poll(repeats, { message: 'exactly this card repeats the one before it' }).toEqual([LAZY_LOAD_DUPLICATE]),
      });
    });
  });
});

/**
 * Cards whose name equals the previous card's name, with their 0-based position — or "still loading" while any card
 * is a placeholder, so a poll keeps reading until every shown card has loaded.
 */
function adjacentRepeats(cards: Product[]): Array<{ position: number; name: string }> | 'still loading' {
  if (cards.some(card => !Number.isFinite(card.price))) return 'still loading';
  return cards.flatMap((card, i) => (i > 0 && card.name === cards[i - 1].name ? [{ position: i, name: card.name }] : []));
}
