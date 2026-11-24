import { expect, test } from '../../../src/fixtures/ui';
import { CUSTOMER } from '../../../src/data/checkout';
import { product } from '../../../src/data/products';

const fleeceJacket = product('Sauce Labs Fleece Jacket');

test('the most expensive product goes first and can be bought', async ({ loggedIn, header, cart, checkout }) => {
  // Act: sort high to low
  await loggedIn.sortBy('hilo');

  // Assert: the most expensive product is first
  const sortedProducts = await loggedIn.products();
  expect(sortedProducts[0]).toEqual(fleeceJacket);

  // Act: add it to the cart and go through checkout
  await loggedIn.addToCart(fleeceJacket.name);
  await header.openCart();
  await cart.checkout();
  await checkout.fillCustomer(CUSTOMER);

  // Assert: totals on the overview step
  expect(await checkout.totals()).toEqual({ itemTotal: 49.99, tax: 4.0, total: 53.99 });
});
