import { expect, test } from './fixtures';
import { cents } from './support/money';
import { CATALOGUE, CUSTOMER, MESSAGES, TAX_RATE } from './support/data';

const order = [CATALOGUE[0], CATALOGUE[2]]; // Backpack $29.99 + Bolt T-Shirt $15.99

test.describe('Checkout', () => {
  test('order of two products: totals add up and the order completes', async ({ page, loggedIn, cart, checkout }) => {
    for (const product of order) await loggedIn.addToCart(product.name);
    await loggedIn.openCart();
    await cart.checkout();
    await checkout.fillCustomer(CUSTOMER);

    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await expect(checkout.overviewItems).toHaveCount(order.length);

    const itemTotal = cents(order.reduce((sum, p) => sum + p.price, 0));
    const tax = cents(itemTotal * TAX_RATE);
    expect(await checkout.totals()).toEqual({ itemTotal, tax, total: cents(itemTotal + tax) });

    await checkout.finish();

    await expect(checkout.completeHeader).toHaveText(MESSAGES.orderComplete);
    await expect(loggedIn.cartBadge).toBeHidden();
  });

  test.describe('negative', () => {
    // Each required field is left empty in turn, the others are filled,
    // so the message proves which field the form validated.
    const cases = [
      { field: 'first name', customer: { ...CUSTOMER, firstName: '' }, message: MESSAGES.firstNameRequired },
      { field: 'last name', customer: { ...CUSTOMER, lastName: '' }, message: MESSAGES.lastNameRequired },
      { field: 'postal code', customer: { ...CUSTOMER, postalCode: '' }, message: MESSAGES.postalCodeRequired },
    ];

    for (const { field, customer, message } of cases) {
      test(`empty ${field} stops the checkout`, async ({ page, loggedIn, cart, checkout }) => {
        await loggedIn.addToCart(order[0].name);
        await loggedIn.openCart();
        await cart.checkout();

        await checkout.fillCustomer(customer);

        await expect(checkout.error).toHaveText(message);
        await expect(page).toHaveURL(/checkout-step-one\.html$/);
      });
    }
  });
});
