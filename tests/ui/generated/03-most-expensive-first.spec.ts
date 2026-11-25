import { expect, test } from '../../../src/fixtures/ui';
import { CUSTOMER } from '../../../src/data/checkout';
import { product } from '../../../src/data/products';
import { area, EPIC } from '../../../src/utils/report';

const fleeceJacket = product('Sauce Labs Fleece Jacket');

test('the most expensive product goes first and can be bought', area(EPIC.ui, 'Catalogue'), async ({ loggedIn, header, cart, checkout }) => {
  // Act: sort high to low
  await loggedIn.sortBy('hilo');

  // Assert: the most expensive product is first
  await expect.poll(async () => (await loggedIn.products())[0], { message: 'the most expensive product is first' }).toEqual(fleeceJacket); // review fix: retry the read until the list settles

  // Act: add it to the cart and go through checkout
  await loggedIn.addToCart(fleeceJacket.name);
  await header.openCart();
  await cart.checkout();
  await checkout.fillCustomer(CUSTOMER);

  // Assert: totals on the overview step
  expect(await checkout.totals(), 'the overview shows the totals for the jacket').toEqual({ itemTotal: 49.99, tax: 4.0, total: 53.99 });
});
