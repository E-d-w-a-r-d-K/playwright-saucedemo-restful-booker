import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER, WHITESPACE_CUSTOMER } from '../../src/data/checkout';
import { MESSAGES } from '../../src/data/messages';
import { product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { knownBug } from '../../src/utils/knownBug';

/*
 * Each test checks the CORRECT behaviour and, while it does not hold, requires the OBSERVED buggy behaviour
 * (see src/utils/knownBug.ts). The test is green only when exactly this bug is present;
 * any other failure — or a fixed bug — makes it red. Bug reports: README.md, "Знайдені баги".
 */
test.describe('Known bugs', { tag: '@known-bug' }, () => {
  test('BUG-UI-1: an order can be placed with an empty cart', async ({ page, header, cart, checkout, loggedIn }) => {
    // Arrange: logged in, nothing added
    await header.openCart();
    await expect(cart.items).toHaveCount(0);

    // Act
    await cart.checkout();

    // Assert
    await knownBug('BUG-UI-1', {
      correct: () => expect(page).toHaveURL(ROUTES.cart),
      observed: async () => {
        await expect(page).toHaveURL(ROUTES.checkoutStepOne);
        await checkout.fillCustomer(CUSTOMER);
        expect(await checkout.totals()).toEqual({ itemTotal: 0, tax: 0, total: 0 });
        await checkout.finish();
        await expect(checkout.completeHeader).toHaveText(MESSAGES.orderComplete);
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
      correct: async () => {
        await expect(checkout.error).toHaveText(MESSAGES.firstNameRequired);
        await expect(page).toHaveURL(ROUTES.checkoutStepOne);
      },
      observed: () => expect(page).toHaveURL(ROUTES.checkoutStepTwo),
    });
  });

  test('BUG-UI-3: Reset App State leaves the "Remove" button on the product', async ({ loggedIn, header }) => {
    // Arrange
    const onesie = product('Sauce Labs Onesie').name;
    await loggedIn.addToCart(onesie);

    // Act
    await header.resetAppState();

    // Assert
    await expect(header.cartBadge).toBeHidden();
    await knownBug('BUG-UI-3', {
      correct: () => expect(loggedIn.cartButton(onesie)).toHaveText('Add to cart'),
      observed: () => expect(loggedIn.cartButton(onesie)).toHaveText('Remove'),
    });
  });
});
