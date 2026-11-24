import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';

const fleeceJacket = product('Sauce Labs Fleece Jacket');

test.describe('Checkout overview cancel', () => {
  test('cancelling on the overview keeps the cart', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(fleeceJacket.name);
    await header.openCart();
    await cart.checkout();
    await checkout.fillCustomer({ firstName: 'Eduard', lastName: 'Krykota', postalCode: '43000' });

    // Act
    await checkout.cancel();

    // Assert
    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(loggedIn.title).toHaveText('Products');
    await expect(header.cartBadge).toHaveText('1');

    await header.openCart();
    expect(await cart.products()).toEqual([fleeceJacket]);
  });
});
