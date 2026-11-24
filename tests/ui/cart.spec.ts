import { expect, test } from './fixtures';
import { CATALOGUE } from './support/data';

const backpack = CATALOGUE[0];
const boltShirt = CATALOGUE[2];

test.describe('Cart', () => {
  test('added products appear in the cart with their prices and the badge counts them', async ({ loggedIn, cart }) => {
    await expect(loggedIn.cartBadge).toBeHidden();

    await loggedIn.addToCart(backpack.name);
    await expect(loggedIn.cartBadge).toHaveText('1');
    await loggedIn.addToCart(boltShirt.name);
    await expect(loggedIn.cartBadge).toHaveText('2');

    await loggedIn.openCart();
    expect(await cart.products()).toEqual([backpack, boltShirt]);
  });

  test('removing a product updates the cart and the badge', async ({ loggedIn, cart }) => {
    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(boltShirt.name);
    await loggedIn.openCart();

    await cart.remove(backpack.name);

    expect(await cart.products()).toEqual([boltShirt]);
    await expect(loggedIn.cartBadge).toHaveText('1');
  });

  test('cart survives a page reload', async ({ page, loggedIn, cart }) => {
    await loggedIn.addToCart(boltShirt.name);

    await page.reload();

    await expect(loggedIn.cartBadge).toHaveText('1');
    await loggedIn.openCart();
    expect(await cart.products()).toEqual([boltShirt]);
  });
});
