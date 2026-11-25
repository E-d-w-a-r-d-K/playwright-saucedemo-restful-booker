import { type Totals } from '../pages/CheckoutPage';

export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const CUSTOMER: Customer = { firstName: 'Eduard', lastName: 'Krykota', postalCode: '43000' };

/** Every field filled with spaces only — must be treated as empty. */
export const WHITESPACE_CUSTOMER: Customer = { firstName: '   ', lastName: '   ', postalCode: '   ' };

/** Tax applied on the checkout overview: 8% of the item total. */
export const TAX_RATE = 0.08;

/** Totals the site shows for Backpack ($29.99) + Bolt T-Shirt ($15.99), taken from the real overview page. */
export const BACKPACK_AND_BOLT_TOTALS: Totals = { itemTotal: 45.98, tax: 3.68, total: 49.66 };

/** Totals the site shows for the Fleece Jacket ($49.99) alone. */
export const FLEECE_JACKET_TOTALS: Totals = { itemTotal: 49.99, tax: 4.0, total: 53.99 };
