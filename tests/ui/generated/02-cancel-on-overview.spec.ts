import { expect, test } from '../../../src/fixtures/ui';
import { CUSTOMER } from '../../../src/data/checkout';
import { product } from '../../../src/data/products';

const fleeceJacket = product('Sauce Labs Fleece Jacket');

test.describe('Checkout overview cancel', () => {
  test('cancelling on the overview keeps the cart', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(fleeceJacket.name);
    await header.openCart();
    await cart.checkout();
    await checkout.fillCustomer(CUSTOMER); // hand fix: test data from src/data, not an inline literal

    // Act
    await checkout.cancel();

    // Assert
    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(loggedIn.title).toHaveText('Products');
    await expect(header.cartBadge).toHaveText('1');

    await header.openCart();
    await expect.poll(() => cart.products()).toEqual([fleeceJacket]); // review fix: retry the read until the list settles
  });
});
