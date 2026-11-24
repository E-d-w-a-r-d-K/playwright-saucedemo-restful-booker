import { type Customer } from '../pages/CheckoutPage';
import { type Product } from '../pages/InventoryPage';

export const PASSWORD = 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
} as const;

/** The full catalogue as the site shows it for standard_user. */
export const CATALOGUE: Product[] = [
  { name: 'Sauce Labs Backpack', price: 29.99 },
  { name: 'Sauce Labs Bike Light', price: 9.99 },
  { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  { name: 'Sauce Labs Onesie', price: 7.99 },
  { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
];

export const TAX_RATE = 0.08;

export const CUSTOMER: Customer = { firstName: 'Eduard', lastName: 'Krykota', postalCode: '43000' };

export const MESSAGES = {
  wrongPassword: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  usernameRequired: 'Epic sadface: Username is required',
  notLoggedIn: "Epic sadface: You can only access '/inventory.html' when you are logged in.",
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
  orderComplete: 'Thank you for your order!',
} as const;
