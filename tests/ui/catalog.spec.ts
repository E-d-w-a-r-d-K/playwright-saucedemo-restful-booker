import { expect, test } from '../../src/fixtures/ui';
import { type SortOption } from '../../src/pages/InventoryPage';
import { CATALOGUE, type Product, product } from '../../src/data/products';
import { ROUTES } from '../../src/data/routes';
import { area, EPIC } from '../../src/utils/report';

const byName = (a: Product, b: Product) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const byPrice = (a: Product, b: Product) => a.price - b.price;

test.describe('Catalogue', area(EPIC.ui, 'Catalogue'), () => {
  test('shows every product with its name and price', async ({ loggedIn }) => {
    // Arrange: logged in by the fixture

    // Act + Assert: read the cards until they settle
    await expect.poll(() => loggedIn.products(), { message: 'the inventory shows exactly these products in this order' }).toEqual(CATALOGUE);
  });

  test('product page shows the same name, price and description as its card', async ({ page, loggedIn, productPage }) => {
    // Arrange
    const jacket = product('Sauce Labs Fleece Jacket');
    const description = await loggedIn.description(jacket.name);

    // Act
    await loggedIn.openProduct(jacket.name);

    // Assert
    await expect(page, 'a product page is open').toHaveURL(ROUTES.product);
    await expect(productPage.name, 'the product page shows the name from the card').toHaveText(jacket.name);
    await expect(productPage.price, 'the product page shows the price from the card').toHaveText(`$${jacket.price.toFixed(2)}`);
    await expect(productPage.description, 'the product page shows the description from the card').toHaveText(description);
  });

  /*
   * A to Z is also the default order, so selecting it on a fresh page would prove nothing.
   * Every sort starts from the OPPOSITE order and then switches; the whole list is compared.
   */
  const nameSorts: Array<{ from: SortOption; to: SortOption; label: string; expected: Product[] }> = [
    { from: 'za', to: 'az', label: 'name A to Z', expected: [...CATALOGUE].sort(byName) },
    { from: 'az', to: 'za', label: 'name Z to A', expected: [...CATALOGUE].sort(byName).reverse() },
  ];

  for (const { from, to, label, expected } of nameSorts) {
    test(`sorting by ${label} orders every card`, async ({ loggedIn }) => {
      // Arrange
      await loggedIn.sortBy(from);
      await expect.poll(() => loggedIn.products(), { message: 'the list starts in a different order' }).not.toEqual(expected);

      // Act
      await loggedIn.sortBy(to);

      // Assert
      await expect.poll(() => loggedIn.products(), { message: 'the inventory shows exactly these products in this order' }).toEqual(expected);
    });
  }

  // Two products cost $15.99; the requirement says nothing about their mutual order,
  // so price sorts compare the sequence of prices plus the set of products.
  const priceSorts: Array<{ from: SortOption; to: SortOption; label: string; expected: Product[] }> = [
    { from: 'hilo', to: 'lohi', label: 'price low to high', expected: [...CATALOGUE].sort(byPrice) },
    { from: 'lohi', to: 'hilo', label: 'price high to low', expected: [...CATALOGUE].sort((a, b) => byPrice(b, a)) },
  ];

  for (const { from, to, label, expected } of priceSorts) {
    test(`sorting by ${label} orders every price`, async ({ loggedIn }) => {
      // Arrange
      await loggedIn.sortBy(from);

      // Act
      await loggedIn.sortBy(to);

      // Assert
      await expect.poll(async () => (await loggedIn.products()).map(p => p.price), { message: 'prices go in the expected order' }).toEqual(expected.map(p => p.price));
      expect(new Set((await loggedIn.products()).map(p => p.name)), 'every product is still listed').toEqual(new Set(CATALOGUE.map(p => p.name)));
    });
  }
});
