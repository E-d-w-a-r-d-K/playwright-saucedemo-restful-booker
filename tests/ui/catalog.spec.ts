import { expect, test } from './fixtures';
import { type SortOption, type Product } from './pages/InventoryPage';
import { CATALOGUE } from './support/data';

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
const byPrice = (a: Product, b: Product) => a.price - b.price;

test.describe('Catalogue', () => {
  test('shows every product with its name and price', async ({ loggedIn }) => {
    expect(await loggedIn.products()).toEqual(CATALOGUE);
  });

  test('product page shows the same name, price and description as its card', async ({ page, loggedIn }) => {
    const card = loggedIn.item('Sauce Labs Fleece Jacket');
    const description = await card.getByTestId('inventory-item-desc').textContent();

    await loggedIn.openDetails('Sauce Labs Fleece Jacket');

    await expect(page).toHaveURL(/inventory-item\.html\?id=\d+/);
    await expect(page.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Fleece Jacket');
    await expect(page.getByTestId('inventory-item-price')).toHaveText('$49.99');
    await expect(page.getByTestId('inventory-item-desc')).toHaveText(description!);
  });

  // Each option is compared with the catalogue sorted in the test, so a wrong comparator
  // (string vs number, reversed direction) fails even when the first card happens to match.
  const sorts: Array<{ option: SortOption; label: string; expected: Product[] }> = [
    { option: 'az', label: 'name A to Z', expected: [...CATALOGUE].sort(byName) },
    { option: 'za', label: 'name Z to A', expected: [...CATALOGUE].sort(byName).reverse() },
    { option: 'lohi', label: 'price low to high', expected: [...CATALOGUE].sort((a, b) => byPrice(a, b) || byName(a, b)) },
    { option: 'hilo', label: 'price high to low', expected: [...CATALOGUE].sort((a, b) => byPrice(b, a) || byName(a, b)) },
  ];

  for (const { option, label, expected } of sorts) {
    test(`sorting by ${label} orders every card`, async ({ loggedIn }) => {
      await loggedIn.sortBy(option);

      const shown = await loggedIn.products();
      if (option === 'lohi' || option === 'hilo') {
        // two products share $15.99; their mutual order is not part of the requirement
        expect(shown.map(p => p.price)).toEqual(expected.map(p => p.price));
        expect(new Set(shown.map(p => p.name))).toEqual(new Set(expected.map(p => p.name)));
      } else {
        expect(shown).toEqual(expected);
      }
    });
  }
});
