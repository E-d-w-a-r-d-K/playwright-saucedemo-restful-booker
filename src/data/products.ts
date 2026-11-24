export interface Product {
  name: string;
  price: number;
}

/** The full catalogue as the site shows it for standard_user, in the default (A to Z) order. */
export const CATALOGUE: Product[] = [
  { name: 'Sauce Labs Backpack', price: 29.99 },
  { name: 'Sauce Labs Bike Light', price: 9.99 },
  { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  { name: 'Sauce Labs Onesie', price: 7.99 },
  { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
];

export const product = (name: string): Product => {
  const found = CATALOGUE.find(p => p.name === name);
  if (!found) throw new Error(`No product "${name}" in CATALOGUE`);
  return found;
};
