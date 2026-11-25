import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER, WHITESPACE_CUSTOMER } from '../../src/data/checkout';
import { MESSAGES } from '../../src/data/messages';
import { product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
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
});
