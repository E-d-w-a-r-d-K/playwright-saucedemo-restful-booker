import { expect, test } from '../../../src/fixtures/ui';
import { CATALOGUE, product } from '../../../src/data/products';

const backpack = product('Sauce Labs Backpack');

test.describe('Product page via image', () => {
  test('clicking the product image opens the product page, and Back to products returns to the catalogue', async ({
    loggedIn,
    productPage,
  }) => {
    // Act
    await loggedIn.openProductByImage(backpack.name);

    // Assert
    await expect(productPage.name).toHaveText(backpack.name);
    await expect(productPage.price).toHaveText(`$${backpack.price}`);

    // Act
    await productPage.backToProducts();

    // Assert
    await expect(loggedIn.title).toHaveText('Products');
    expect(await loggedIn.products()).toEqual(CATALOGUE);
  });
});
