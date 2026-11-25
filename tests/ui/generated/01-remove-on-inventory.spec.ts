import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';
import { area, EPIC } from '../../../src/utils/report';

const bikeLight = product('Sauce Labs Bike Light');
const onesie = product('Sauce Labs Onesie');

test.describe('Cart', area(EPIC.ui, 'Cart'), () => {
  test('removing a product on the products page updates the cart', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(bikeLight.name);
    await loggedIn.addToCart(onesie.name);

    // Act
    await loggedIn.removeFromCart(bikeLight.name);

    // Assert
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');

    await header.openCart();
    await expect.poll(() => cart.products(), { message: 'the cart holds exactly these products with these prices' }).toEqual([onesie]); // review fix: retry the read until the list settles
  });
});
