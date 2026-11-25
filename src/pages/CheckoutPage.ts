import { type Locator, type Page } from '@playwright/test';
import { type Customer } from '../data/checkout';
import { parsePrice } from '../utils/money';
import { step } from '../utils/step';

export interface Totals {
  itemTotal: number;
  tax: number;
  total: number;
}

/** Both checkout steps: customer form (step one) and overview (step two), plus the completion page. */
export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly overviewItems: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.overviewItems = page.getByTestId('inventory-item');
    this.completeHeader = page.getByTestId('complete-header');
  }

  /** "Back Home" on the completion page (its data-test is "back-to-products"). */
  async backHome() {
    await step('Press "Back Home"', () => this.page.getByTestId('back-to-products').click());
  }

  async fillCustomer(customer: Customer) {
    await step(`Fill in the customer form ("${customer.firstName}" / "${customer.lastName}" / "${customer.postalCode}") and continue`, async () => {
      await this.firstName.fill(customer.firstName);
      await this.lastName.fill(customer.lastName);
      await this.postalCode.fill(customer.postalCode);
      await this.continueButton.click();
    });
  }

  /** Reads "Item total: $45.98", "Tax: $3.68", "Total: $49.66" from the overview step. */
  async totals(): Promise<Totals> {
    return {
      itemTotal: parsePrice(await this.page.getByTestId('subtotal-label').textContent()),
      tax: parsePrice(await this.page.getByTestId('tax-label').textContent()),
      total: parsePrice(await this.page.getByTestId('total-label').textContent()),
    };
  }

  async cancel() {
    await step('Press Cancel', () => this.cancelButton.click());
  }

  async finish() {
    await step('Press Finish', () => this.finishButton.click());
  }
}
