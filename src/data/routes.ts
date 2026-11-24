/** Page addresses of saucedemo, as URL patterns for toHaveURL. */
export const ROUTES = {
  inventory: /\/inventory\.html$/,
  product: /\/inventory-item\.html\?id=\d+$/,
  cart: /\/cart\.html$/,
  checkoutStepOne: /\/checkout-step-one\.html$/,
  checkoutStepTwo: /\/checkout-step-two\.html$/,
  checkoutComplete: /\/checkout-complete\.html$/,
} as const;
