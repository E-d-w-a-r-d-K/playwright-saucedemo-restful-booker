import { expect, test } from './fixtures';
import { CATALOGUE } from './support/data';

/*
 * Each test states the CORRECT behaviour and is marked test.fail() while the bug exists:
 * the suite stays green, and the day the bug is fixed the test turns red as "unexpectedly passed",
 * which tells us to drop the marker. Bug reports: README.md, section "Знайдені баги".
 */
test.describe('Known bugs (expected to fail until fixed)', () => {
  test('BUG-UI-1: an order cannot be placed with an empty cart', async ({ page, loggedIn, cart, checkout }) => {
    test.fail(true, 'BUG-UI-1: the empty cart goes through checkout and the order completes for $0');

    await loggedIn.openCart();
    await expect(cart.items).toHaveCount(0);
    await cart.checkout();

    // Correct behaviour: the checkout does not start without products.
    await expect(page).toHaveURL(/cart\.html$/);
  });

  test('BUG-UI-2: checkout rejects names and postal code made of spaces', async ({ page, loggedIn, cart, checkout }) => {
    test.fail(true, 'BUG-UI-2: whitespace-only first name, last name and postal code are accepted');

    await loggedIn.addToCart(CATALOGUE[0].name);
    await loggedIn.openCart();
    await cart.checkout();
    await checkout.fillCustomer({ firstName: '   ', lastName: '   ', postalCode: '   ' });

    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(checkout.error).toBeVisible();
  });

  test('BUG-UI-3: Reset App State also resets the "Remove" buttons', async ({ loggedIn }) => {
    test.fail(true, 'BUG-UI-3: the cart empties but the product button keeps saying "Remove"');

    const product = CATALOGUE[4].name;
    await loggedIn.addToCart(product);
    await loggedIn.resetAppState();

    await expect(loggedIn.cartBadge).toBeHidden();
    await expect(loggedIn.item(product).getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });
});
