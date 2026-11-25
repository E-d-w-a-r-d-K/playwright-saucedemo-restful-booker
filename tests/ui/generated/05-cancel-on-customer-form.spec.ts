import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';
import { ROUTES } from '../../../src/data/routes';
import { area, EPIC } from '../../../src/utils/report';

const bikeLight = product('Sauce Labs Bike Light');

test.describe('Checkout - cancel on customer form', area(EPIC.ui, 'Checkout'), () => {
  test('cancel on the customer form returns to the cart', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(bikeLight.name);
    await header.openCart();
    await cart.checkout();

    // Act
    await checkout.cancel();

    // Assert
    await expect(page, 'the cart page is open').toHaveURL(ROUTES.cart);
    await expect.poll(() => cart.products(), { message: 'the cart holds exactly these products with these prices' }).toEqual([bikeLight]);
  });
});
