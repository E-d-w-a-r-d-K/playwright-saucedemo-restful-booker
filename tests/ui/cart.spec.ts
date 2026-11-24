import { expect, test } from '../../src/fixtures/ui';
import { product } from '../../src/data/products';

const backpack = product('Sauce Labs Backpack');
const boltShirt = product('Sauce Labs Bolt T-Shirt');

test.describe('Cart', () => {
  test('added products appear in the cart with their prices and the badge counts them', async ({ loggedIn, header, cart }) => {
    // Arrange
    await expect(header.cartBadge).toBeHidden();

    // Act
    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Assert
    await expect(header.cartBadge).toHaveText('2');
    await expect.poll(() => cart.products()).toEqual([backpack, boltShirt]);
  });

  test('removing a product in the cart updates the cart and the badge', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Act
    await cart.remove(backpack.name);

    // Assert
    await expect.poll(() => cart.products()).toEqual([boltShirt]);
    await expect(header.cartBadge).toHaveText('1');
  });

  test('removing the last product empties the cart and hides the badge', async ({ loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(boltShirt.name);
    await header.openCart();

    // Act
    await cart.remove(boltShirt.name);

    // Assert
    await expect(cart.items).toHaveCount(0);
    await expect(header.cartBadge).toBeHidden();
  });

  test('cart survives a page reload', async ({ page, loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(boltShirt.name);

    // Act
    await page.reload();

    // Assert
    await expect(header.cartBadge).toHaveText('1');
    await header.openCart();
    await expect.poll(() => cart.products()).toEqual([boltShirt]);
  });
});
