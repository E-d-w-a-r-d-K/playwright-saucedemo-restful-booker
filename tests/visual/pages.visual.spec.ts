import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER } from '../../src/data/checkout';
import { product } from '../../src/data/products';
import { BROKEN_IMAGE_MARKER, USERS } from '../../src/data/users';
import { knownBug } from '../../src/utils/knownBug';
import { area, EPIC } from '../../src/utils/report';

/*
 * Screenshot comparison: each test renders a page in a fixed state and compares it with the approved
 * baseline in tests/visual/__screenshots__/<platform>/. Baselines are per platform because fonts render
 * differently on Windows and Linux; CI compares against the linux ones.
 * Update baselines only on purpose:  npm run test:visual:update
 */
test.describe('Visual', area(EPIC.visual, 'Page screenshots'), () => {
  test('login page', async ({ page, loginPage }) => {
    await loginPage.open();

    await expect(page, 'the login page matches the baseline').toHaveScreenshot('login.png');
  });

  test('inventory page', async ({ page, loggedIn }) => {
    await expect(loggedIn.items, 'all 6 products are shown').toHaveCount(6);

    await expect(page, 'the inventory page matches the baseline').toHaveScreenshot('inventory.png', { fullPage: true });
  });

  test('product page', async ({ page, loggedIn, productPage }) => {
    await loggedIn.openProduct(product('Sauce Labs Backpack').name);
    await expect(productPage.name, 'the product page is shown').toBeVisible();

    await expect(page, 'the product page matches the baseline').toHaveScreenshot('product-backpack.png');
  });

  test('cart with two products', async ({ page, loggedIn, header, cart }) => {
    await loggedIn.addToCart(product('Sauce Labs Backpack').name);
    await loggedIn.addToCart(product('Sauce Labs Bolt T-Shirt').name);
    await header.openCart();
    await expect(cart.items, 'the cart holds 2 products').toHaveCount(2);

    await expect(page, 'the cart matches the baseline').toHaveScreenshot('cart-two-products.png');
  });

  test('checkout overview', async ({ page, loggedIn, header, cart, checkout }) => {
    await loggedIn.addToCart(product('Sauce Labs Backpack').name);
    await header.openCart();
    await cart.checkout();
    await checkout.fillCustomer(CUSTOMER);
    await expect(checkout.finishButton, 'the overview is shown').toBeVisible();

    await expect(page, 'the checkout overview matches the baseline').toHaveScreenshot('checkout-overview.png', { fullPage: true });
  });

  // Proof that the comparison catches real changes: visual_user sees the same catalogue with deliberately
  // broken visuals. Compared with the standard_user baseline it must not match, and the reason must be the
  // known one (the placeholder picture), not something else.
  test('BUG-VIS-1: visual_user inventory differs from the approved design', { tag: '@known-bug' }, async ({ page, loginAs }) => {
    // Arrange + Act
    const inventory = await loginAs(USERS.visual);
    await expect(inventory.items, 'all 6 products are shown').toHaveCount(6);

    // Assert
    await knownBug('BUG-VIS-1', {
      severity: 'normal',
      correct: () => expect(page, 'visual_user sees the approved inventory design').toHaveScreenshot('inventory.png', { fullPage: true }),
      observed: async () => expect(await inventory.imageSource(product('Sauce Labs Backpack').name), 'the backpack shows the placeholder picture').toContain(BROKEN_IMAGE_MARKER),
    });
  });
});
