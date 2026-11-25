import { expect, test } from '../../../src/fixtures/ui';
import { CATALOGUE, product } from '../../../src/data/products';
import { area, EPIC } from '../../../src/utils/report';

const backpack = product('Sauce Labs Backpack');

test.describe('Product page via image', area(EPIC.ui, 'Catalogue'), () => {
  test('clicking the product image opens the product page, and Back to products returns to the catalogue', async ({
    loggedIn,
    productPage,
  }) => {
    // Act
    await loggedIn.openProductByImage(backpack.name);

    // Assert
    await expect(productPage.name, 'the product page shows the name from the card').toHaveText(backpack.name);
    await expect(productPage.price, 'the product page shows the price from the card').toHaveText(`$${backpack.price.toFixed(2)}`); // hand fix: format with two decimals instead of relying on number-to-string

    // Act
    await productPage.backToProducts();

    // Assert
    await expect(loggedIn.title, 'the inventory page is open').toHaveText('Products');
    await expect.poll(() => loggedIn.products(), { message: 'the inventory shows exactly these products in this order' }).toEqual(CATALOGUE); // review fix: retry the read until the list settles
  });
});
