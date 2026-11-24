import { type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../support/money';

export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export interface Totals {
  itemTotal: number;
  tax: number;
  total: number;
}

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly completeHeader: Locator;
  readonly overviewItems: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.completeHeader = page.getByTestId('complete-header');
    this.overviewItems = page.getByTestId('inventory-item');
  }

  async fillCustomer(customer: Customer) {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
    await this.continueButton.click();
  }

  /** Reads "Item total: $45.98", "Tax: $3.68", "Total: $49.66" from the overview step. */
  async totals(): Promise<Totals> {
    return {
      itemTotal: parsePrice(await this.page.getByTestId('subtotal-label').textContent()),
      tax: parsePrice(await this.page.getByTestId('tax-label').textContent()),
      total: parsePrice(await this.page.getByTestId('total-label').textContent()),
    };
  }

  async finish() {
    await this.finishButton.click();
  }
}
