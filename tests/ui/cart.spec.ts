import { expect, test } from '../../src/fixtures/ui';
import { product } from '../../src/data/products';
import { area, EPIC } from '../../src/utils/report';

const backpack = product('Sauce Labs Backpack');
const boltShirt = product('Sauce Labs Bolt T-Shirt');

test.describe('Cart', area(EPIC.ui, 'Cart'), () => {
  test('added products appear in the cart with their prices and the badge counts them', async ({ loggedIn, header, cart }) => {
    // Arrange
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();

    // Act
    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Assert
    await expect(header.cartBadge, 'the cart badge shows 2').toHaveText('2');
    await expect.poll(() => cart.products(), { message: 'the cart holds exactly these products with these prices' }).toEqual([backpack, boltShirt]);
  });

  test('removing a product in the cart updates the cart and the badge', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Act
    await cart.remove(backpack.name);

    // Assert
    await expect.poll(() => cart.products(), { message: 'the cart holds exactly these products with these prices' }).toEqual([boltShirt]);
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');
  });

  test('removing the last product empties the cart and hides the badge', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Act
    await cart.remove(boltShirt.name);

    // Assert
    await expect(cart.items, 'the cart is empty').toHaveCount(0);
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
  });

  test('cart survives a page reload', async ({ page, loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(boltShirt.name);

    // Act
    await page.reload();

    // Assert
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');
    await header.openCart();
    await expect.poll(() => cart.products(), { message: 'the cart holds exactly these products with these prices' }).toEqual([boltShirt]);
  });
});
