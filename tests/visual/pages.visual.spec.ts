import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER } from '../../src/data/checkout';
import { product } from '../../src/data/products';
import { BROKEN_IMAGE_MARKER, USERS } from '../../src/data/users';
import { knownBug } from '../../src/utils/knownBug';
import { area, EPIC } from '../../src/utils/report';
import { hasBaselines, INVENTORY_MUTATIONS, PIXEL_DIFF } from '../../src/utils/visual';

/*
 * Screenshot comparison: each test renders a page in a fixed state and compares it with the approved
 * baseline in tests/visual/__screenshots__/<platform>/. Baselines are per platform because fonts render
 * differently on Windows and Linux; CI compares against the linux ones.
 * Update baselines only on purpose:  npm run test:visual:update
 */
test.describe('Visual', area(EPIC.visual, 'Page screenshots'), () => {
  // On an OS without committed baselines (e.g. macOS) there is nothing to compare with: skip with the reason
  // instead of failing on "snapshot doesn't exist". Creating baselines (--update-snapshots) is still allowed.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      !hasBaselines() && testInfo.config.updateSnapshots === 'none',
      `no approved screenshots for ${process.platform}: run "npm run test:visual:update" to create them`,
    );
  });

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

  // Sensitivity: small regressions of the kind a real release brings must fail the comparison with a pixel diff.
  // Tagged @mutation so "test:visual:update" never writes a mutated page as the baseline.
  test.describe('the comparison catches a small change', { tag: '@mutation' }, () => {
    for (const mutation of INVENTORY_MUTATIONS) {
      test(mutation.name, async ({ page, loggedIn }) => {
        // Arrange
        await expect(loggedIn.items, 'all 6 products are shown').toHaveCount(6);

        // Act
        await mutation.apply(page);

        // Assert
        await expect(
          expect(page, 'the changed page differs from the baseline').toHaveScreenshot('inventory.png', { fullPage: true }),
          'the comparison fails with a pixel diff',
        ).rejects.toThrow(PIXEL_DIFF);
      });
    }
  });

  // visual_user sees the same catalogue with deliberately broken visuals (a demo user of the site).
  // Compared with the standard_user baseline it must fail with a pixel diff — not a missing baseline or
  // a timeout — and the known cause (the placeholder picture) must be there.
  test('BUG-VIS-1: visual_user inventory differs from the approved design', { tag: '@known-bug' }, async ({ page, loginAs }) => {
    // Arrange + Act
    const inventory = await loginAs(USERS.visual);
    await expect(inventory.items, 'all 6 products are shown').toHaveCount(6);

    // Assert
    await knownBug('BUG-VIS-1', {
      severity: 'normal',
      correct: () => expect(page, 'visual_user sees the approved inventory design').toHaveScreenshot('inventory.png', { fullPage: true }),
      correctFailsWith: PIXEL_DIFF,
      observed: async () =>
        expect(await inventory.imageSource(product('Sauce Labs Backpack').name), 'the backpack shows the placeholder picture').toContain(
          BROKEN_IMAGE_MARKER,
        ),
    });
  });
});
