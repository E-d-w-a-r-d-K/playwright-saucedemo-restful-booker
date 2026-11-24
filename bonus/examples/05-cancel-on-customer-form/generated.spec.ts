import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';
import { ROUTES } from '../../../src/data/routes';

const bikeLight = product('Sauce Labs Bike Light');

test.describe('Checkout - cancel on customer form', () => {
  test('cancel on the customer form returns to the cart', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(bikeLight.name);
    await header.openCart();
    await cart.checkout();

    // Act
    await checkout.cancel();

    // Assert
    await expect(page).toHaveURL(ROUTES.cart);
    await expect.poll(() => cart.products()).toEqual([bikeLight]);
  });
});
