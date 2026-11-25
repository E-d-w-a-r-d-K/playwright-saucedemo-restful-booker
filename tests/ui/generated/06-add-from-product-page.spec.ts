import { expect, test } from '../../../src/fixtures/ui';
import { product } from '../../../src/data/products';
import { area, EPIC } from '../../../src/utils/report';

const onesie = product('Sauce Labs Onesie');

test.describe('Cart', area(EPIC.ui, 'Cart'), () => {
  test('a product can be added to the cart from its own page', async ({ loggedIn, header, productPage }) => {
    // Arrange
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
    await loggedIn.openProduct(onesie.name);

    // Act
    await productPage.addToCart();

    // Assert
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');
    await expect(productPage.cartButton, 'the product page button changes to "Remove"').toHaveText('Remove');
  });
});
