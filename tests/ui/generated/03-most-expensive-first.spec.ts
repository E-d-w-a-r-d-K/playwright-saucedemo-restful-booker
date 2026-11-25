import { expect, test } from '../../../src/fixtures/ui';
import { CUSTOMER, FLEECE_JACKET_TOTALS } from '../../../src/data/checkout';
import { MESSAGES } from '../../../src/data/messages';
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
  expect(await checkout.totals(), 'the overview shows the totals for the jacket').toEqual(FLEECE_JACKET_TOTALS); // hand fix: totals from src/data

  // hand fix: the title says "can be bought", but the case stopped at the overview — finish the order
  await checkout.finish();
  await expect(checkout.completeHeader, 'the order is confirmed').toHaveText(MESSAGES.orderComplete);
});
