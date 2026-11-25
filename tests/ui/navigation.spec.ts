import { expect, test } from '../../src/fixtures/ui';
import { CUSTOMER } from '../../src/data/checkout';
import { ABOUT_URL, SOCIAL_LINKS } from '../../src/data/links';
import { MESSAGES } from '../../src/data/messages';
import { product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { stubExternalPages } from '../../src/utils/network';
import { area, EPIC } from '../../src/utils/report';

const backpack = product('Sauce Labs Backpack');

test.describe('Navigation', area(EPIC.ui, 'Navigation'), () => {
  test('"Continue Shopping" returns from the cart to the catalogue and keeps the cart', async ({ page, loggedIn, header, cart }) => {
    // Arrange
    await loggedIn.addToCart(backpack.name);
    await header.openCart();

    // Act
    await cart.continueShopping();

    // Assert
    await expect(page, 'the inventory page is open').toHaveURL(ROUTES.inventory);
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');
    await expect(loggedIn.cartButton(backpack.name), 'the product button still says "Remove"').toHaveText('Remove');
  });

  test('"Back Home" after a finished order returns to the catalogue with an empty cart', async ({ page, loggedIn, header, cart, checkout }) => {
    // Arrange
    await loggedIn.addToCart(backpack.name);
    await header.openCart();
    await cart.checkout();
    await checkout.fillCustomer(CUSTOMER);
    await checkout.finish();
    await expect(checkout.completeHeader, 'the order is confirmed').toHaveText(MESSAGES.orderComplete);

    // Act
    await checkout.backHome();

    // Assert
    await expect(page, 'the inventory page is open').toHaveURL(ROUTES.inventory);
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
    await expect(loggedIn.cartButton(backpack.name), 'the product button says "Add to cart" again').toHaveText('Add to cart');
  });

  test('menu "All Items" opens the catalogue from another page', async ({ page, loggedIn, header }) => {
    // Arrange
    await header.openCart();
    await expect(page, 'the cart page is open').toHaveURL(ROUTES.cart);

    // Act
    await header.openAllItems();

    // Assert
    await expect(page, 'the inventory page is open').toHaveURL(ROUTES.inventory);
    await expect(header.title, 'the catalogue title is shown').toHaveText('Products');
  });

  test('the menu opens and closes with its buttons', async ({ loggedIn, header }) => {
    // Act + Assert
    await header.openMenu();
    await expect(header.aboutLink, 'the menu is open').toBeVisible();

    await header.closeMenu();
    await expect(header.aboutLink, 'the menu is closed').toBeHidden();
  });

  // External pages are stubbed: the test proves where the site sends the user, without loading saucelabs.com.
  test('menu "About" takes the user to saucelabs.com', async ({ page, context, loggedIn, header }) => {
    // Arrange
    await stubExternalPages(context, [ABOUT_URL]);

    // Act
    await header.openAbout();

    // Assert
    await expect(page, 'the browser is on saucelabs.com').toHaveURL(ABOUT_URL);
  });

  test('footer social links lead to the Sauce Labs accounts in a new tab', async ({ context, loggedIn, footer }) => {
    // Arrange
    await stubExternalPages(context, SOCIAL_LINKS.map(link => link.href));

    // Assert: the whole list — names, addresses, order and target
    await expect.poll(() => footer.links(), { message: 'the footer shows exactly these social links' }).toEqual(SOCIAL_LINKS);

    // Act + Assert: each link really opens its address in a new tab
    for (const link of SOCIAL_LINKS) {
      const tab = await footer.openSocial(link.name);
      expect(tab.url(), `"${link.name}" opened its address in a new tab`).toBe(link.href);
      await tab.close();
    }
  });

  test('the product page adds the product to the cart and removes it again', async ({ loggedIn, header, productPage }) => {
    // Arrange
    await loggedIn.openProduct(backpack.name);

    // Act + Assert: add
    await productPage.addToCart();
    await expect(header.cartBadge, 'the cart badge shows 1').toHaveText('1');
    await expect(productPage.cartButton, 'the button now says "Remove"').toHaveText('Remove');

    // Act + Assert: remove
    await productPage.removeFromCart();
    await expect(header.cartBadge, 'the cart badge is hidden').toBeHidden();
    await expect(productPage.cartButton, 'the button says "Add to cart" again').toHaveText('Add to cart');
  });
});
