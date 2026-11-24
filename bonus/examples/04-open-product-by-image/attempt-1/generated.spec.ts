// NOTE: this scenario cannot be implemented with the current page objects without
// inventing selectors:
// - InventoryPage has no locator/method for a product's IMAGE specifically.
//   openProduct(name) only clicks the item's NAME (getByTestId('inventory-item-name')).
//   There is no equivalent for the image (e.g. an "item-image" locator or
//   openProductByImage(name) method).
// - ProductPage has no "Back to products" button locator or goBack() method.
// Add an image locator to InventoryPage's card and a back-button locator/method to
// ProductPage, then replace the TODOs below with real actions.

import { expect, test } from '../../../src/fixtures/ui';
import { CATALOGUE, product } from '../../../src/data/products';

test.describe('Open product by image', () => {
  test.skip(
    true,
    'Missing page-object support: InventoryPage has no image locator/method, ProductPage has no back-button locator/method',
  );

  test('a product page opens by clicking the product image', async ({ loggedIn, productPage }) => {
    const backpack = product('Sauce Labs Backpack');

    // Arrange: standard_user is logged in and the products page is open (loggedIn fixture).

    // Act: click the IMAGE of "Sauce Labs Backpack" (not the name).
    // TODO: await loggedIn.openProductImage(backpack.name); // method does not exist yet

    // Assert: the product page shows the correct name and price.
    await expect(productPage.name).toHaveText(backpack.name);
    await expect(productPage.price).toHaveText(`$${backpack.price}`);

    // Act: click "Back to products".
    // TODO: await productPage.backToProducts(); // locator/method does not exist yet

    // Assert: the products page is shown again with all 6 products.
    await expect(loggedIn.title).toHaveText('Products');
    expect(await loggedIn.products()).toEqual(CATALOGUE);
  });
});
