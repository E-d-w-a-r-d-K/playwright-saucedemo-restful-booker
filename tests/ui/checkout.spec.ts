import { expect, test } from '../../src/fixtures/ui';
import { BACKPACK_AND_BOLT_TOTALS, CUSTOMER, TAX_RATE } from '../../src/data/checkout';
import { MESSAGES } from '../../src/data/messages';
import { product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { cents } from '../../src/utils/money';
import { area, EPIC, severity } from '../../src/utils/report';

const order = [product('Sauce Labs Backpack'), product('Sauce Labs Bolt T-Shirt')];

test.describe('Checkout', area(EPIC.ui, 'Checkout'), () => {
  test('order of two products: totals add up and the order completes', severity('critical'), async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    for (const item of order) await loggedIn.addToCart(item.name);
    await header.openCart();
    await cart.checkout();

    // Act
    await checkout.fillCustomer(CUSTOMER);

    // Assert: the overview shows both products and the totals the site really shows for them,
    // and those totals follow the rule "item total = sum of prices, tax = 8%, total = item total + tax"
    await expect(page, 'checkout step two (overview) is open').toHaveURL(ROUTES.checkoutStepTwo);
    await expect(checkout.overviewItems, 'the overview lists every ordered product').toHaveCount(order.length);
    const totals = await checkout.totals();
    expect(totals, 'the overview shows item total $45.98, tax $3.68, total $49.66').toEqual(BACKPACK_AND_BOLT_TOTALS);
    const itemTotal = cents(order.reduce((sum, p) => sum + p.price, 0));
    const tax = cents(itemTotal * TAX_RATE);
    expect(totals, 'totals follow the rule: sum of prices + 8% tax').toEqual({ itemTotal, tax, total: cents(itemTotal + tax) });

    // Act: finish
    await checkout.finish();

    // Assert: the order is complete and the cart is empty
    await expect(page, 'the order completion page is open').toHaveURL(ROUTES.checkoutComplete);
    await expect(checkout.completeHeader, 'the order is confirmed').toHaveText(MESSAGES.orderComplete);
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
    await cart.open();
    await expect(cart.items, 'the cart is empty').toHaveCount(0);
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
      test(`empty ${field} stops the checkout`, async ({ page, loggedIn, header, cart, checkout }) => {
        // Arrange
        await loggedIn.addToCart(order[0].name);
        await header.openCart();
        await cart.checkout();

        // Act
        await checkout.fillCustomer(customer);

        // Assert
        await expect(checkout.error, 'the checkout form shows the error').toHaveText(message);
        await expect(page, 'checkout step one (customer form) is open').toHaveURL(ROUTES.checkoutStepOne);
      });
    }
  });
});
