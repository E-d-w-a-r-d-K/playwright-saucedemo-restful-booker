import { type Locator, type Page } from '@playwright/test';
import { step } from '../utils/step';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.error = page.getByTestId('error');
  }

  async open() {
    await step('Open the login page', () => this.page.goto('/'));
  }

  async login(username: string, password: string) {
    await step(`Log in through the form as "${username}"`, async () => {
      await this.username.fill(username);
      await this.password.fill(password);
      await this.loginButton.click();
    });
  }

  async submitEmpty() {
    await step('Press Login with empty fields', () => this.loginButton.click());
  }
}
