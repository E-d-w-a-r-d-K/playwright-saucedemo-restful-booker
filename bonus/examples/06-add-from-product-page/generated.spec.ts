// GAP: ProductPage (src/pages/ProductPage.ts) has no locator/action for the "Add to cart" / "Remove"
// button on the product page — it only exposes name, price, description and backButton. Per CLAUDE.md
// ("a missing action goes into the page object first"), ProductPage needs something like an
// `addToCart()` method and a `cartButton` locator (mirroring InventoryPage.cartButton) before this
// test can click the button and assert its label change without inventing a selector here.
// The test is written against that expected page-object API and skipped until it exists.

import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';

const onesie = product('Sauce Labs Onesie');

test.describe('Product page', () => {
  test.skip('a product can be added to the cart from its own page', async ({ loggedIn, header, productPage }) => {
    // Arrange
    await expect(header.cartBadge).toBeHidden();
    await loggedIn.openProduct(onesie.name);
    await expect(productPage.name).toHaveText(onesie.name);

    // Act
    // await productPage.addToCart();

    // Assert
    // await expect(header.cartBadge).toHaveText('1');
    // await expect(productPage.cartButton).toHaveText('Remove');
  });
});
