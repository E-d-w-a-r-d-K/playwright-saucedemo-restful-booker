import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';

const bikeLight = product('Sauce Labs Bike Light');
const onesie = product('Sauce Labs Onesie');

test.describe('Cart', () => {
  test('removing a product on the products page updates the cart', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(bikeLight.name);
    await loggedIn.addToCart(onesie.name);

    // Act
    await loggedIn.removeFromCart(bikeLight.name);

    // Assert
    await expect(header.cartBadge).toHaveText('1');

    await header.openCart();
    expect(await cart.products()).toEqual([onesie]);
  });
});
